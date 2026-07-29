import { Skeleton, SkeletonGroup, SkeletonLines, SkeletonRows } from "@/components/ui/skeleton";

function AppChrome({ children, label }: { children: React.ReactNode; label: string }) {
  return <SkeletonGroup label={label} className="cfy-shell min-h-svh text-zinc-100 lg:flex">
    <aside className="cfy-sidebar hidden w-64 shrink-0 p-4 lg:block">
      <div className="flex items-center gap-3 px-2 py-3"><Skeleton className="size-9 rounded-xl" /><Skeleton className="h-4 w-28" /></div>
      <div className="mt-7 space-y-2">{Array.from({ length: 8 }, (_, i) => <div key={i} className="flex h-11 items-center gap-3 px-2"><Skeleton className="size-5 rounded-md" /><Skeleton className="h-3.5" style={{ width: `${72 + (i % 3) * 18}px` }} /></div>)}</div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl border border-white/[.06] p-3"><Skeleton className="size-9 rounded-full" /><SkeletonLines className="flex-1" /></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="cfy-topbar sticky top-0 z-20 flex h-16 items-center gap-3 px-4 sm:px-6"><Skeleton className="size-9 rounded-xl lg:hidden" /><Skeleton className="h-9 w-full max-w-sm" /><div className="ml-auto flex gap-2"><Skeleton className="size-9 rounded-xl" /><Skeleton className="size-9 rounded-full" /></div></header>
      {children}
    </div>
  </SkeletonGroup>;
}

function PageHeading({ action = true }: { action?: boolean }) {
  return <div className="mb-7 flex items-end justify-between gap-4"><div className="space-y-3"><Skeleton className="h-8 w-48 sm:w-64" /><Skeleton className="h-3.5 w-64 max-w-[70vw] sm:w-96" /></div>{action && <Skeleton className="hidden h-11 w-32 sm:block" />}</div>;
}

function Toolbar({ filters = 2 }: { filters?: number }) {
  return <div className="mb-5 flex flex-wrap gap-3"><Skeleton className="h-11 min-w-56 flex-1 sm:max-w-xs" />{Array.from({ length: filters }, (_, i) => <Skeleton key={i} className="h-11 w-28" />)}</div>;
}

function Card({ className = "h-48" }: { className?: string }) {
  return <div className={`cfy-skeleton-card ${className}`}><Skeleton className="h-24 w-full rounded-xl" /><div className="mt-4 flex items-center gap-3"><Skeleton className="size-9 rounded-full" /><SkeletonLines className="flex-1" /></div></div>;
}

export function DashboardSkeleton() {
  return <AppChrome label="Loading dashboard"><main className="mx-auto max-w-[1560px] p-4 py-7 sm:px-6 xl:px-10"><PageHeading action={false} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div className="cfy-skeleton-card h-36" key={i}><Skeleton className="size-10 rounded-xl" /><Skeleton className="mt-5 h-7 w-20" /><Skeleton className="mt-2 h-3 w-28" /></div>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]"><div className="cfy-skeleton-card h-80"><Skeleton className="h-4 w-40" /><Skeleton className="mt-8 h-52 w-full rounded-xl" /></div><div className="cfy-skeleton-card h-80"><Skeleton className="h-4 w-32" /><SkeletonRows rows={4} className="mt-6" rowClassName="h-11" /></div></div><div className="mt-5 grid gap-5 xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div className="cfy-skeleton-card h-72" key={i}><Skeleton className="h-4 w-36" /><SkeletonRows rows={4} className="mt-6" rowClassName="h-10" /></div>)}</div></main></AppChrome>;
}

export function ProjectsSkeleton() {
  return <AppChrome label="Loading projects"><main className="mx-auto max-w-[1560px] p-4 py-7 sm:px-6 xl:px-10"><PageHeading /><Toolbar /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Card key={i} className="h-72" />)}</div><div className="mt-5 flex justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-40" /></div></main></AppChrome>;
}

export function AssignmentSkeleton() {
  return <AppChrome label="Loading assignment form"><main className="mx-auto max-w-5xl p-4 py-7 sm:px-6"><PageHeading action={false} /><section className="cfy-skeleton-card space-y-7 p-5 sm:p-8"><div className="grid gap-5 sm:grid-cols-2">{Array.from({ length: 5 }, (_, i) => <div className="space-y-2" key={i}><Skeleton className="h-3 w-24" /><Skeleton className="h-11 w-full" /></div>)}<div className="space-y-2"><Skeleton className="h-3 w-24" /><div className="flex gap-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-11 flex-1" />)}</div></div></div><div><Skeleton className="h-3 w-28" /><Skeleton className="mt-2 h-36 w-full" /></div><div><Skeleton className="h-3 w-28" /><Skeleton className="mt-2 h-28 w-full border border-dashed border-white/[.08]" /></div><div className="flex justify-end gap-3"><Skeleton className="h-11 w-24" /><Skeleton className="h-11 w-36" /></div></section></main></AppChrome>;
}

export function KanbanSkeleton() {
  return <AppChrome label="Loading Kanban board"><main className="overflow-hidden p-4 py-7 sm:px-8 xl:px-10"><PageHeading /><Toolbar filters={4} /><div className="flex gap-4 overflow-hidden">{Array.from({ length: 4 }, (_, column) => <div key={column} className="cfy-skeleton-card h-[610px] min-w-[280px] flex-1"><div className="flex items-center gap-2"><Skeleton className="size-3 rounded-full" /><Skeleton className="h-4 w-28" /><Skeleton className="ml-auto h-5 w-7 rounded-md" /></div><div className="mt-5 space-y-3">{Array.from({ length: column % 2 ? 3 : 4 }, (_, card) => <div key={card} className="rounded-2xl border border-white/[.06] p-4"><Skeleton className="h-4 w-4/5" /><Skeleton className="mt-3 h-3 w-1/2" /><div className="mt-7 flex justify-between"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="size-7 rounded-full" /></div></div>)}</div></div>)}</div></main></AppChrome>;
}

export function FilesSkeleton() {
  return <AppChrome label="Loading files"><main className="mx-auto max-w-[1560px] p-4 py-7 sm:px-6 xl:px-10"><PageHeading /><Skeleton className="mb-5 h-48 w-full border border-dashed border-white/[.08]" /><Toolbar filters={3} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Card key={i} className="h-60" />)}</div></main></AppChrome>;
}

export function NotificationsSkeleton() {
  return <AppChrome label="Loading notifications"><main className="mx-auto max-w-6xl p-4 py-7 sm:px-6"><PageHeading action={false} /><Toolbar filters={2} /><div className="grid gap-5 xl:grid-cols-[1.5fr_.8fr]"><div className="cfy-skeleton-card"><SkeletonRows rows={7} rowClassName="h-[88px]" /></div><div className="cfy-skeleton-card"><Skeleton className="h-4 w-36" /><SkeletonRows rows={6} className="mt-5" rowClassName="h-12" /></div></div></main></AppChrome>;
}

export function ProfileSkeleton() {
  return <AppChrome label="Loading profile"><main className="mx-auto max-w-[1560px] p-4 py-7 sm:px-6 xl:px-10"><PageHeading action={false} /><div className="cfy-skeleton-card flex flex-col gap-6 sm:flex-row sm:items-center"><Skeleton className="size-28 rounded-full" /><div className="flex-1"><Skeleton className="h-7 w-52" /><Skeleton className="mt-3 h-4 w-64" /><div className="mt-5 flex gap-3"><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-28" /></div></div></div><div className="mt-5 grid gap-5 lg:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <div className="cfy-skeleton-card h-64" key={i}><Skeleton className="h-4 w-36" /><SkeletonRows rows={4} className="mt-6" rowClassName="h-10" /></div>)}</div></main></AppChrome>;
}

export function TeamSkeleton() {
  return <AppChrome label="Loading team"><main className="mx-auto max-w-[1560px] p-4 py-7 sm:px-6 xl:px-10"><PageHeading /><Toolbar /><div className="cfy-skeleton-card"><div className="hidden grid-cols-[2fr_1fr_1fr_100px] gap-4 border-b border-white/[.06] pb-4 md:grid">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-3 w-20" />)}</div>{Array.from({ length: 7 }, (_, i) => <div key={i} className="flex items-center gap-4 border-b border-white/[.05] py-4 last:border-0"><Skeleton className="size-10 rounded-full" /><SkeletonLines className="min-w-0 flex-1" /><Skeleton className="hidden h-7 w-24 md:block" /><Skeleton className="h-6 w-16 rounded-full" /></div>)}</div></main></AppChrome>;
}

export function CalendarSkeleton() {
  return <AppChrome label="Loading calendar"><main className="mx-auto max-w-[1560px] p-4 py-7 sm:px-6 xl:px-10"><PageHeading /><div className="mb-4 flex gap-3"><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-48" /><Skeleton className="ml-auto h-10 w-28" /></div><div className="grid gap-5 xl:grid-cols-[1fr_290px]"><div className="cfy-skeleton-card overflow-hidden"><div className="grid grid-cols-7 gap-px">{Array.from({ length: 42 }, (_, i) => <Skeleton key={i} className="h-20 rounded-md sm:h-28" />)}</div></div><div className="cfy-skeleton-card"><Skeleton className="h-4 w-36" /><SkeletonRows rows={6} className="mt-5" rowClassName="h-14" /></div></div></main></AppChrome>;
}

export function SettingsSkeleton() {
  return <AppChrome label="Loading settings"><main className="mx-auto max-w-[1560px] p-4 py-7 sm:px-6 xl:px-10"><PageHeading action={false} /><div className="grid gap-5 lg:grid-cols-[220px_1fr]"><div className="cfy-skeleton-card h-fit"><SkeletonRows rows={7} rowClassName="h-10" /></div><div className="cfy-skeleton-card"><Skeleton className="h-6 w-48" /><Skeleton className="mt-2 h-3 w-72 max-w-full" /><div className="mt-8 grid gap-5 sm:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <div key={i}><Skeleton className="h-3 w-24" /><Skeleton className="mt-2 h-11 w-full" /></div>)}</div><div className="mt-8 flex justify-end gap-3"><Skeleton className="h-11 w-24" /><Skeleton className="h-11 w-32" /></div></div></div></main></AppChrome>;
}

