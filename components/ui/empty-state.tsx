import Link from "next/link";
import { BellRing, FolderKanban, ListChecks, Plus, RefreshCw, UsersRound, type LucideIcon } from "lucide-react";

type EmptyStateKind = "projects" | "tasks" | "team" | "notifications";
type EmptyAction = { label: string; href?: string; onClick?: () => void; icon?: LucideIcon };

const illustrations: Record<EmptyStateKind, LucideIcon> = { projects: FolderKanban, tasks: ListChecks, team: UsersRound, notifications: BellRing };

export function EmptyState({ kind, title, description, primary, secondary, className = "" }: { kind: EmptyStateKind; title: string; description: string; primary: EmptyAction; secondary?: EmptyAction; className?: string }) {
  const Icon = illustrations[kind];
  return <section className={`cfy-empty-state ${className}`} aria-labelledby={`empty-${kind}-title`}>
    <div className="cfy-empty-illustration" aria-hidden="true"><span className="cfy-empty-orbit" /><Icon /><span className="cfy-empty-dot cfy-empty-dot-one" /><span className="cfy-empty-dot cfy-empty-dot-two" /></div>
    <h2 id={`empty-${kind}-title`}>{title}</h2><p>{description}</p>
    <div className="cfy-empty-actions"><EmptyAction action={primary} primary /><>{secondary && <EmptyAction action={secondary} />}</></div>
  </section>;
}

function EmptyAction({ action, primary = false }: { action: EmptyAction; primary?: boolean }) {
  const Icon = action.icon ?? (primary ? Plus : RefreshCw);
  const className = primary ? "cfy-empty-primary" : "cfy-empty-secondary";
  if (action.href) return <Link href={action.href} className={className}><Icon />{action.label}</Link>;
  return <button type="button" className={className} onClick={action.onClick}><Icon />{action.label}</button>;
}
