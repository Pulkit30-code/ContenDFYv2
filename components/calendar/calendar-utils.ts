export function addDays(date: Date, amount: number) { const next = new Date(date); next.setDate(next.getDate() + amount); return next; }
/** Move between calendar months without allowing dates such as January 31 to skip February. */
export function addMonths(date: Date, amount: number) {
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth() + amount, 1, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  return next;
}
export function beginningOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
export function endOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 0) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - ((next.getDay() - weekStartsOn + 7) % 7));
  return next;
}
/** A complete month surface is always six weeks (42 dates), including adjacent months. */
export function getMonthGrid(date: Date, weekStartsOn: 0 | 1 = 0) {
  const first = startOfWeek(beginningOfMonth(date), weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}
export function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
export function daysBetween(a: Date, b: Date) { return Math.round((a.getTime() - b.getTime()) / 86_400_000); }
export function formatDay(date: Date) { return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(date); }
