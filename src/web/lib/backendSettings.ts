const STORAGE_KEY = "ghovas.backend-settings";

export interface BackendSettings {
  shell: string;
  cwd: string;
  scrollbackMiB: number;
}

const DEFAULTS: BackendSettings = {
  shell: "",
  cwd: "",
  scrollbackMiB: 1,
};

export function loadBackendSettings(): BackendSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<BackendSettings>;
    return {
      shell: typeof parsed.shell === "string" ? parsed.shell : DEFAULTS.shell,
      cwd: typeof parsed.cwd === "string" ? parsed.cwd : DEFAULTS.cwd,
      scrollbackMiB:
        typeof parsed.scrollbackMiB === "number" && parsed.scrollbackMiB > 0
          ? parsed.scrollbackMiB
          : DEFAULTS.scrollbackMiB,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveBackendSettings(settings: BackendSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable; proceed silently
  }
}
