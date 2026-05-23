const STORAGE_KEY = "ghovas.iframe-url-history";
const MAX = 10;

export function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function recordVisit(url: string): void {
  const history = loadHistory().filter((x) => x !== url);
  history.unshift(url);
  if (history.length > MAX) history.length = MAX;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // storage full or unavailable — silently ignore
  }
}
