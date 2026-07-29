import type { TableRow } from "@/types/database";

export type DashboardRow = Record<string, unknown>;

export function rows<T>(data: T[] | undefined): DashboardRow[] {
  return (data ?? []) as DashboardRow[];
}

export function stringValue(row: DashboardRow, keys: string[], fallback = "Untitled") {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

export function dateValue(row: DashboardRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  return null;
}

export function statusValue(row: DashboardRow) {
  return stringValue(row, ["status", "state", "stage"], "Unassigned");
}

export function idValue(row: DashboardRow) {
  return stringValue(row, ["id", "project_id", "task_id"], "");
}

export function labelize(value: string) {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(date: Date | null) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export function relativeDate(date: Date | null) {
  if (!date) return "No timestamp";
  const hours = Math.round((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export type ProductionRow = TableRow<"projects">;
