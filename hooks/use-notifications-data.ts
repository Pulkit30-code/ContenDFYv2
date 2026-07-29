"use client";

import { useCallback, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import type { TableRow } from "@/types/database";

const PAGE_SIZE = 20;
export type NotificationFilter = "all" | "unread" | "mentions" | "assignments" | "approvals";
export const notificationsKey = (filter: NotificationFilter, search: string) => ["supabase", "notifications", "feed", filter, search] as const;
export const activityKey = ["supabase", "activity_logs", "timeline"] as const;

type NotificationRow = TableRow<"notifications">;
type RealtimeEntry = {
  client: ReturnType<typeof createClient>;
  channel: ReturnType<ReturnType<typeof createClient>["channel"]>;
  refreshers: Set<() => void>;
  consumers: number;
  disposeTimer?: ReturnType<typeof setTimeout>;
};

/**
 * Supabase returns the same channel instance for an existing topic. Keeping
 * this registry means every postgres callback is registered exactly once,
 * before subscribe(), even when multiple UI surfaces use this hook.
 */
const realtimeEntries = new Map<string, RealtimeEntry>();

function addRealtimeConsumer(channelName: string, refresh: () => void) {
  const existing = realtimeEntries.get(channelName);
  if (existing) {
    if (existing.disposeTimer) {
      clearTimeout(existing.disposeTimer);
      existing.disposeTimer = undefined;
    }
    existing.consumers += 1;
    existing.refreshers.add(refresh);
    return () => removeRealtimeConsumer(channelName, refresh);
  }

  const client = createClient();
  const refreshers = new Set<() => void>([refresh]);
  const refreshConsumers = () => refreshers.forEach((callback) => callback());
  const channel = client
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, refreshConsumers)
    .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, refreshConsumers)
    .subscribe();

  realtimeEntries.set(channelName, { client, channel, refreshers, consumers: 1 });
  return () => removeRealtimeConsumer(channelName, refresh);
}

function removeRealtimeConsumer(channelName: string, refresh: () => void) {
  const entry = realtimeEntries.get(channelName);
  if (!entry) return;

  entry.refreshers.delete(refresh);
  entry.consumers = Math.max(0, entry.consumers - 1);
  if (entry.consumers) return;

  // Defer disposal one task so React can finish cleanup/re-subscribe cycles
  // without recreating a joined channel and adding callbacks after subscribe.
  entry.disposeTimer = setTimeout(() => {
    if (entry.consumers) return;
    realtimeEntries.delete(channelName);
    void entry.client.removeChannel(entry.channel);
  }, 0);
}

function notificationQuery(filter: NotificationFilter, search: string, page: number) {
  let query = createClient().from("notifications").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (filter === "unread") query = query.eq("is_read", false);
  if (filter !== "all" && filter !== "unread") query = query.or(`type.ilike.%${filter.slice(0, -1)}%,notification_type.ilike.%${filter.slice(0, -1)}%`);
  if (search.trim()) query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,message.ilike.%${search.trim()}%`);
  return query;
}

async function requireBrowserUser() {
  const { data, error } = await createClient().auth.getUser();
  if (error || !data.user) throw new Error("Your session has expired. Please sign in again.");
  return data.user;
}

export function useNotificationsData(filter: NotificationFilter, search: string) {
  const queryClient = useQueryClient();
  const auth = useQuery({
    queryKey: ["supabase", "auth", "current-user"],
    queryFn: async () => {
      const { data, error } = await createClient().auth.getUser();
      if (error || !data.user) return null;
      return data.user;
    },
    staleTime: 30_000,
  });
  const userId = auth.data?.id;
  const workspaceMembership = useQuery({
    queryKey: ["supabase", "workspace_memberships", "notification-scope", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await createClient().from("workspace_memberships").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
      if (error) throw error;
      return data as { workspace_id?: string | null } | null;
    },
  });
  const workspaceId = workspaceMembership.data?.workspace_id ?? undefined;
  const realtimeChannelName = workspaceId ? `workspace-notification-center:${workspaceId}` : undefined;
  const notifications = useInfiniteQuery({
    queryKey: notificationsKey(filter, search),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error, count } = await notificationQuery(filter, search, pageParam);
      if (error) throw error;
      return { rows: (data ?? []) as NotificationRow[], count: count ?? 0, page: pageParam };
    },
    enabled: Boolean(userId && workspaceId),
    getNextPageParam: (lastPage) => lastPage.rows.length === PAGE_SIZE ? lastPage.page + 1 : undefined,
  });
  const activity = useQuery({
    queryKey: activityKey,
    queryFn: async () => {
      const { data, error } = await createClient().from("activity_logs").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as TableRow<"activity_logs">[];
    },
    enabled: Boolean(userId && workspaceId),
  });
  const unreadCount = useQuery({
    queryKey: ["supabase", "notifications", "unread-count"],
    queryFn: async () => {
      const { count, error } = await createClient().from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(userId && workspaceId),
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["supabase", "notifications"] });
    void queryClient.invalidateQueries({ queryKey: activityKey });
  }, [queryClient]);

  useEffect(() => {
    // Realtime must not initialize against an incomplete auth/workspace scope.
    // This also ensures a missing channel identifier is a safe no-op rather
    // than a property access on an undefined workspace or channel object.
    if (!auth.isSuccess || !userId || !workspaceMembership.isSuccess || !workspaceId || !realtimeChannelName) return;

    return addRealtimeConsumer(realtimeChannelName, refresh);
  }, [auth.isSuccess, realtimeChannelName, refresh, userId, workspaceId, workspaceMembership.isSuccess]);

  const updateCached = (id: string, patch: Record<string, unknown>) => {
    queryClient.setQueriesData<{ pages: { rows: NotificationRow[]; count: number; page: number }[]; pageParams: number[] }>({ queryKey: ["supabase", "notifications", "feed"] }, (current) => current ? { ...current, pages: current.pages.map((page) => ({ ...page, rows: page.rows.map((row) => String(row.id) === id ? { ...row, ...patch } : row) })) } : current);
  };
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await requireBrowserUser(); const { error } = await createClient().from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => { await queryClient.cancelQueries({ queryKey: ["supabase", "notifications"] }); const previous = queryClient.getQueriesData({ queryKey: ["supabase", "notifications", "feed"] }); updateCached(id, { is_read: true, read_at: new Date().toISOString() }); return { previous }; },
    onError: (_error, _id, context) => context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: refresh,
  });
  const markAllRead = useMutation({
    mutationFn: async () => { await requireBrowserUser(); const { error } = await createClient().from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("is_read", false); if (error) throw error; },
    onMutate: async () => { await queryClient.cancelQueries({ queryKey: ["supabase", "notifications"] }); const previous = queryClient.getQueriesData({ queryKey: ["supabase", "notifications", "feed"] }); queryClient.setQueriesData({ queryKey: ["supabase", "notifications", "feed"] }, (current: { pages: { rows: NotificationRow[] }[] } | undefined) => current ? { ...current, pages: current.pages.map((page) => ({ ...page, rows: page.rows.map((row) => ({ ...row, is_read: true })) })) } : current); return { previous }; },
    onError: (_error, _variables, context) => context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await requireBrowserUser(); const { error } = await createClient().from("notifications").delete().eq("id", id); if (error) throw error; },
    onMutate: async (id) => { await queryClient.cancelQueries({ queryKey: ["supabase", "notifications"] }); const previous = queryClient.getQueriesData({ queryKey: ["supabase", "notifications", "feed"] }); queryClient.setQueriesData({ queryKey: ["supabase", "notifications", "feed"] }, (current: { pages: { rows: NotificationRow[] }[] } | undefined) => current ? { ...current, pages: current.pages.map((page) => ({ ...page, rows: page.rows.filter((row) => String(row.id) !== id) })) } : current); return { previous }; },
    onError: (_error, _id, context) => context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: refresh,
  });

  return { notifications, activity, unreadCount, markRead, markAllRead, remove };
}
