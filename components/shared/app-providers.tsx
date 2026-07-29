"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { GlobalCommandCenterProvider } from "@/components/shared/global-command-center";
import { WorkspaceProvider } from "@/components/shared/workspace-provider";
import { applyAppearance, readAppearance } from "@/lib/appearance";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } } }));
  useEffect(() => { const saved = readAppearance(); if (saved) applyAppearance(saved); }, []);
  return <QueryClientProvider client={queryClient}><WorkspaceProvider><GlobalCommandCenterProvider>{children}</GlobalCommandCenterProvider></WorkspaceProvider><Toaster closeButton position="top-right" richColors theme="dark" /></QueryClientProvider>;
}
