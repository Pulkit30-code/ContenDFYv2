export function formatDate(value: Date | string, options?: Intl.DateTimeFormatOptions) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", ...options }).format(new Date(value)); }
