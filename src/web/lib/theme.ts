export type Theme = "dark" | "light";

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem("ghovas.theme");
    if (stored === "light") return "light";
    return "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem("ghovas.theme", theme);
  } catch {
    // localStorage unavailable; proceed silently
  }
  applyTheme(theme);
}
