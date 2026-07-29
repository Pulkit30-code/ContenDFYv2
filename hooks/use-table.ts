"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { createCrudService, type ListOptions } from "@/services/crud-service";
import type { TableInsert, TableName, TableRow, TableUpdate } from "@/types/database";

export const tableQueryKey = (table: TableName, id?: string) => ["supabase", table, id ?? "list"] as const;

function service<T extends TableName>(table: T) { return createCrudService(createClient(), table); }

function useAuthenticatedBrowserUser() {
  return useQuery({
    queryKey: ["supabase", "auth", "current-user"],
    queryFn: async () => {
      const { data, error } = await createClient().auth.getUser();
      if (error || !data.user) return null;
      return data.user;
    },
    staleTime: 30_000,
  });
}

async function requireBrowserUser() {
  const { data, error } = await createClient().auth.getUser();
  if (error || !data.user) throw new Error("Your session has expired. Please sign in again.");
  return data.user;
}

export function useTableList<T extends TableName>(table: T, options?: ListOptions) {
  const auth = useAuthenticatedBrowserUser();
  return useQuery({
    queryKey: tableQueryKey(table),
    queryFn: async () => {
      if (!auth.data?.id) return [] as TableRow<T>[];
      return service(table).list(options);
    },
    enabled: (options?.enabled ?? true) && Boolean(auth.data?.id),
  });
}

export function useTableRecord<T extends TableName>(table: T, id: string | undefined) {
  const auth = useAuthenticatedBrowserUser();
  return useQuery({ queryKey: tableQueryKey(table, id), queryFn: () => service(table).findById(id!), enabled: Boolean(id && auth.data?.id) });
}

export function useCreateRecord<T extends TableName>(table: T) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (input: TableInsert<T>) => { await requireBrowserUser(); return service(table).create(input); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: tableQueryKey(table) }) });
}

export function useUpdateRecord<T extends TableName>(table: T) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TableUpdate<T> }) => { await requireBrowserUser(); return service(table).update(id, input); },
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: tableQueryKey(table) });
      const previous = queryClient.getQueryData<TableRow<T>[]>(tableQueryKey(table));
      queryClient.setQueryData<TableRow<T>[]>(tableQueryKey(table), (current) => current?.map((row) => String(row[service(table).primaryKey]) === id ? { ...row, ...input } : row));
      return { previous };
    },
    onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(tableQueryKey(table), context.previous); },
    onSettled: (_data, _error, variables) => Promise.all([queryClient.invalidateQueries({ queryKey: tableQueryKey(table) }), queryClient.invalidateQueries({ queryKey: tableQueryKey(table, variables.id) })]),
  });
}

export function useDeleteRecord<T extends TableName>(table: T) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await requireBrowserUser(); return service(table).remove(id); },
    onMutate: async (id) => { await queryClient.cancelQueries({ queryKey: tableQueryKey(table) }); const previous = queryClient.getQueryData<TableRow<T>[]>(tableQueryKey(table)); queryClient.setQueryData<TableRow<T>[]>(tableQueryKey(table), (current) => current?.filter((row) => String(row[service(table).primaryKey]) !== id)); return { previous }; },
    onError: (_error, _id, context) => { if (context?.previous) queryClient.setQueryData(tableQueryKey(table), context.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tableQueryKey(table) }),
  });
}
