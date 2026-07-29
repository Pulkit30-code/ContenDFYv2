export type AppearancePreferences = { theme?: "dark" | "light" | "system"; accent?: string; density?: "comfortable" | "compact"; animations?: boolean; glass?: number };

export const appearanceStorageKey = "contendfy.settings.preferences";

export function applyAppearance(preferences: AppearancePreferences) {
  if (typeof window === "undefined") return;
  const preference = preferences.theme ?? "dark";
  const theme = preference === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark"); root.classList.toggle("light", theme === "light");
  root.dataset.cfyTheme = theme; root.dataset.cfyDensity = preferences.density ?? "comfortable"; root.dataset.cfyMotion = preferences.animations === false ? "reduced" : "full";
  root.style.colorScheme = theme; root.style.setProperty("--cfy-accent", preferences.accent ?? "#9b87ff"); root.style.setProperty("--cfy-accent-bright", preferences.accent ?? "#c1b6ff"); root.style.setProperty("--cfy-glass-blur", `${preferences.glass ?? 22}px`);
}

export function readAppearance(): AppearancePreferences | null { if (typeof window === "undefined") return null; try { return JSON.parse(localStorage.getItem(appearanceStorageKey) ?? "null") as AppearancePreferences | null; } catch { return null; } }
