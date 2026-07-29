export function addDays(date: Date, amount: number) { const next = new Date(date); next.setDate(next.getDate() + amount); return next; }
export function addMonths(date: Date, amount: number) { const next = new Date(date); next.setMonth(next.getMonth() + amount); return next; }
export function beginningOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
export function endOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
/** Monday-first calendar weeks, matching the production scheduling standard. */
export function startOfWeek(date: Date) { const next = new Date(date); next.setHours(0, 0, 0, 0); next.setDate(next.getDate() - ((next.getDay() + 6) % 7)); return next; }
export function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
export function daysBetween(a: Date, b: Date) { return Math.round((a.getTime() - b.getTime()) / 86_400_000); }
export function formatDay(date: Date) { return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(date); }
