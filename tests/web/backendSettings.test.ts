import { describe, test, expect, beforeEach, vi } from "vitest";
import { loadBackendSettings, saveBackendSettings } from "../../src/web/lib/backendSettings";
import type { BackendSettings } from "../../src/web/lib/backendSettings";

const store = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: (index: number) => [...store.keys()][index] ?? null,
};

vi.stubGlobal("localStorage", localStorageMock);

beforeEach(() => {
  store.clear();
});

describe("loadBackendSettings", () => {
  test("returns defaults when storage is empty", () => {
    const s = loadBackendSettings();
    expect(s.shell).toBe("");
    expect(s.cwd).toBe("");
    expect(s.scrollbackMiB).toBe(1);
  });

  test("restores saved values", () => {
    const saved: BackendSettings = { shell: "/bin/zsh", cwd: "/home/user", scrollbackMiB: 4 };
    saveBackendSettings(saved);
    expect(loadBackendSettings()).toEqual(saved);
  });

  test("ignores invalid scrollbackMiB and falls back to default", () => {
    localStorageMock.setItem("ghovas.backend-settings", JSON.stringify({ scrollbackMiB: -1 }));
    expect(loadBackendSettings().scrollbackMiB).toBe(1);
  });

  test("returns defaults on malformed JSON", () => {
    localStorageMock.setItem("ghovas.backend-settings", "not-json");
    const s = loadBackendSettings();
    expect(s.scrollbackMiB).toBe(1);
  });
});

describe("saveBackendSettings", () => {
  test("persists all fields to localStorage", () => {
    saveBackendSettings({ shell: "/bin/fish", cwd: "/tmp", scrollbackMiB: 2 });
    const raw = localStorageMock.getItem("ghovas.backend-settings");
    expect(JSON.parse(raw!)).toEqual({ shell: "/bin/fish", cwd: "/tmp", scrollbackMiB: 2 });
  });
});
