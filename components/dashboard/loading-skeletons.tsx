export { Skeleton } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function WidgetSkeleton({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3 p-5">{Array.from({ length: rows }, (_, index) => <div className="flex items-center gap-3" key={index}><Skeleton className="size-8 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-3/5" /><Skeleton className="h-2.5 w-2/5" /></div></div>)}</div>;
}

export { DashboardSkeleton } from "@/components/skeletons/page-skeletons";
