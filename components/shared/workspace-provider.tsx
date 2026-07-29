"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { rows, stringValue, type DashboardRow } from "@/components/dashboard/dashboard-utils";
import { tableQueryKey, useTableList } from "@/hooks/use-table";
import { createClient } from "@/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type WorkspaceIdentity = { profile?: DashboardRow; workspace?: DashboardRow; setting?: DashboardRow; workspaces: DashboardRow[]; workspaceId: string; selectWorkspace: (workspaceId: string) => void; refreshWorkspaceBranding: (workspaceId?: string) => void; name: string; workspaceName: string; workspaceLogoUrl: string; role: string; avatarUrl: string; currencyCode: string; currencySymbol: string; isLoading: boolean };

const currencySymbols: Record<string, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };
const WorkspaceIdentityContext = createContext<WorkspaceIdentity | null>(null);

function displayName(profile: DashboardRow | undefined, email: string | null) {
  return stringValue(profile ?? {}, ["full_name", "display_name", "username", "name"], email?.split("@")[0] ?? "Workspace user");
}

function displayRole(profile: DashboardRow | undefined, membership: DashboardRow | undefined) {
  const role = stringValue(membership ?? profile ?? {}, ["role", "workspace_role", "member_role", "job_title", "title"], "Owner");
  return role.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [brandingVersions, setBrandingVersions] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const profiles = useTableList("profiles", { orderBy: "updated_at" });
  const workspaces = useTableList("workspaces", { orderBy: "created_at" });
  const settings = useTableList("workspace_settings", { orderBy: "created_at" });
  const memberships = useTableList("workspace_memberships", { orderBy: "created_at" });

  useEffect(() => {
    let active = true;
    void createClient().auth.getUser().then(({ data, error }) => {
      if (active) {
        setEmail(error ? null : data.user?.email ?? null);
        setUserId(error ? null : data.user?.id ?? null);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setSelectedWorkspaceId(window.localStorage.getItem("contendfy.selected-workspace") ?? "");
  }, []);
  const selectWorkspace = useCallback((workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    window.localStorage.setItem("contendfy.selected-workspace", workspaceId);
  }, []);
  const refreshWorkspaceBranding = useCallback((workspaceId?: string) => {
    const resolvedWorkspaceId = workspaceId ?? selectedWorkspaceId;
    setBrandingVersions((current) => ({ ...current, [resolvedWorkspaceId]: new Date().toISOString() }));
    void queryClient.invalidateQueries({ queryKey: tableQueryKey("workspaces") });
    void queryClient.invalidateQueries({ queryKey: tableQueryKey("workspace_settings") });
  }, [queryClient, selectedWorkspaceId]);

  const value = useMemo<WorkspaceIdentity>(() => {
    const profileRows = rows(profiles.data);
    const workspaceRows = rows(workspaces.data);
    const settingRows = rows(settings.data);
    const membershipRows = rows(memberships.data);
    // Auth user IDs are immutable, unlike email addresses. Resolve the current
    // profile by ID first so a newly provisioned account always gets its saved
    // display name after a refresh or a later sign-in.
    const profile = (userId ? profileRows.find((row) => String(row.id ?? row.user_id ?? "") === userId) : undefined)
      ?? (email ? profileRows.find((row) => stringValue(row, ["email"], "").toLowerCase() === email.toLowerCase()) : undefined);
    const workspace = workspaceRows.find((row) => String(row.id ?? "") === selectedWorkspaceId) ?? workspaceRows[0];
    const workspaceId = String(workspace?.id ?? "");
    const setting = settingRows.find((row) => !workspaceId || String(row.workspace_id ?? "") === workspaceId) ?? settingRows[0];
    const profileId = String(profile?.id ?? profile?.user_id ?? "");
    const membership = membershipRows.find((row) => (!workspaceId || String(row.workspace_id ?? "") === workspaceId) && (
      String(row.profile_id ?? row.user_id ?? row.member_id ?? "") === (userId ?? profileId)
      || (email ? stringValue(row, ["email", "user_email"], "").toLowerCase() === email.toLowerCase() : false)
    ));
    let localDraft: DashboardRow = {};
    try { if (typeof window !== "undefined") localDraft = JSON.parse(localStorage.getItem("contendfy.settings.workspace-draft") ?? "{}") as DashboardRow; } catch { /* Supabase rows remain authoritative */ }
    // Settings are the canonical branding record. Fall back per-field instead of
    // replacing the whole object: an older settings row must not mask a freshly
    // saved workspace value or the no-workspace local draft.
    const logoKeys = ["logo_url", "workspace_logo_url", "avatar_url"];
    const rawLogoUrl = stringValue(setting ?? {}, logoKeys, stringValue(workspace ?? {}, logoKeys, stringValue(localDraft, logoKeys, "")));
    const version = brandingVersions[workspaceId] ?? String(setting?.updated_at ?? setting?.logo_updated_at ?? workspace?.updated_at ?? workspace?.logo_updated_at ?? localDraft.updated_at ?? localDraft.logo_updated_at ?? "");
    const workspaceLogoUrl = rawLogoUrl && !rawLogoUrl.startsWith("data:") && !rawLogoUrl.startsWith("blob:") && version ? `${rawLogoUrl}${rawLogoUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}` : rawLogoUrl;
    const currencyCode = stringValue(setting ?? {}, ["currency", "currency_code"], stringValue(workspace ?? {}, ["currency", "currency_code"], stringValue(localDraft, ["currency", "currency_code"], "USD"))).toUpperCase();
    const workspaceName = stringValue(setting ?? {}, ["workspace_name", "name", "title", "agency_name"], stringValue(workspace ?? {}, ["workspace_name", "name", "title", "agency_name"], stringValue(localDraft, ["workspace_name", "name", "title", "agency_name"], "ContenDFY")));
    return { profile, workspace, setting, workspaces: workspaceRows, workspaceId: String(workspace?.id ?? ""), selectWorkspace, refreshWorkspaceBranding, name: displayName(profile, email), workspaceName, workspaceLogoUrl, role: displayRole(profile, membership), avatarUrl: stringValue(profile ?? {}, ["avatar_url", "avatar", "image_url", "photo_url"], ""), currencyCode, currencySymbol: currencySymbols[currencyCode] ?? "$", isLoading: profiles.isLoading || workspaces.isLoading || settings.isLoading || memberships.isLoading };
  }, [brandingVersions, email, memberships.data, memberships.isLoading, profiles.data, profiles.isLoading, refreshWorkspaceBranding, selectWorkspace, selectedWorkspaceId, settings.data, settings.isLoading, userId, workspaces.data, workspaces.isLoading]);

  return <WorkspaceIdentityContext.Provider value={value}>{children}</WorkspaceIdentityContext.Provider>;
}

export function useWorkspaceIdentity() {
  const identity = useContext(WorkspaceIdentityContext);
  if (!identity) throw new Error("useWorkspaceIdentity must be used within WorkspaceProvider");
  return identity;
}
