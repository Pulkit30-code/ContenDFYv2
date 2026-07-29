import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = ComponentPropsWithoutRef<"div">;

/** Accessible, theme-aware shimmer primitive. Decorative children stay hidden from AT. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={cn("cfy-skeleton", className)} {...props} />;
}

export function SkeletonGroup({ className, label = "Loading content", children, ...props }: SkeletonProps & { label?: string; children: ReactNode }) {
  return <div role="status" aria-live="polite" aria-busy="true" aria-label={label} className={cn("cfy-skeleton-group", className)} {...props}>{children}<span className="sr-only">{label}</span></div>;
}

export function SkeletonLines({ lines = 2, className }: { lines?: number; className?: string }) {
  return <div className={cn("space-y-2", className)}>{Array.from({ length: lines }, (_, index) => <Skeleton key={index} className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")} />)}</div>;
}

export function SkeletonRows({ rows = 6, className, rowClassName = "h-16" }: { rows?: number; className?: string; rowClassName?: string }) {
  return <div className={cn("space-y-2", className)}>{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className={rowClassName} />)}</div>;
}

