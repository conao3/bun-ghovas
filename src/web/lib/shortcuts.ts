export type ShortcutDef = {
  id: string;
  label: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
};

const STORAGE_KEY = "ghovas.shortcut-overrides";

export function loadOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveOverride(id: string, combo: string): void {
  const overrides = loadOverrides();
  overrides[id] = combo;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function clearOverride(id: string): void {
  const overrides = loadOverrides();
  delete overrides[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function clearAllOverrides(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function normalizeCombo(combo: string): string {
  const parts = combo.split("+");
  const key = parts[parts.length - 1]!;
  const mods = parts.slice(0, -1);
  const hasMod = mods.some((p) => p === "Mod" || p === "Ctrl");
  const hasAlt = mods.includes("Alt");
  const hasShift = mods.includes("Shift");
  const result: string[] = [];
  if (hasMod) result.push("Mod");
  if (hasAlt) result.push("Alt");
  if (hasShift) result.push("Shift");
  result.push(key);
  return result.join("+");
}

export function shortcutDefToCombo(def: ShortcutDef): string {
  const parts: string[] = [];
  if (def.mod) parts.push("Mod");
  if (def.alt) parts.push("Alt");
  if (def.shift) parts.push("Shift");
  parts.push(def.key.toUpperCase());
  return parts.join("+");
}

export function eventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push("Mod");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(key);
  return parts.join("+");
}

export function parseComboToFields(
  combo: string,
): Pick<ShortcutDef, "mod" | "shift" | "alt" | "key"> {
  const normalized = normalizeCombo(combo);
  const parts = normalized.split("+");
  const key = parts[parts.length - 1]!.toLowerCase();
  const mods = parts.slice(0, -1);
  return {
    mod: mods.includes("Mod"),
    alt: mods.includes("Alt"),
    shift: mods.includes("Shift"),
    key,
  };
}

export function getShortcutBinding(id: string): ShortcutDef {
  const def = SHORTCUTS.find((s) => s.id === id);
  if (!def) throw new Error(`Unknown shortcut: ${id}`);
  const overrides = loadOverrides();
  const override = overrides[id];
  if (!override) return def;
  return { ...def, ...parseComboToFields(override) };
}

export const SHORTCUTS: ShortcutDef[] = [
  {
    id: "toggle-command-palette",
    label: "Toggle command palette",
    mod: true,
    shift: false,
    alt: false,
    key: "k",
  },
  { id: "open-settings", label: "Open settings", mod: true, shift: false, alt: false, key: "," },
  {
    id: "cycle-l0-canvas",
    label: "Cycle next canvas in L0",
    mod: false,
    shift: false,
    alt: true,
    key: "0",
  },
  {
    id: "cycle-l1-canvas",
    label: "Cycle next canvas in L1",
    mod: false,
    shift: false,
    alt: true,
    key: "1",
  },
  {
    id: "cycle-l2-canvas",
    label: "Cycle next canvas in L2",
    mod: false,
    shift: false,
    alt: true,
    key: "2",
  },
  {
    id: "cycle-l3-canvas",
    label: "Cycle next canvas in L3",
    mod: false,
    shift: false,
    alt: true,
    key: "3",
  },
  {
    id: "close-focused-window",
    label: "Close focused window",
    mod: true,
    shift: false,
    alt: false,
    key: "w",
  },
  {
    id: "cycle-next-window",
    label: "Focus next window",
    mod: true,
    shift: false,
    alt: false,
    key: "]",
  },
  {
    id: "cycle-prev-window",
    label: "Focus previous window",
    mod: true,
    shift: false,
    alt: false,
    key: "[",
  },
];

export function matchesShortcut(e: KeyboardEvent, def: ShortcutDef): boolean {
  return (
    (e.metaKey || e.ctrlKey) === def.mod &&
    e.shiftKey === def.shift &&
    e.altKey === def.alt &&
    e.key.toLowerCase() === def.key.toLowerCase()
  );
}

export function isGlobalShortcut(e: KeyboardEvent): boolean {
  return SHORTCUTS.some((def) => matchesShortcut(e, getShortcutBinding(def.id)));
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export function formatShortcut(def: ShortcutDef): string {
  const parts: string[] = [];
  if (def.mod) parts.push(isMac ? "⌘" : "Ctrl");
  if (def.shift) parts.push(isMac ? "⇧" : "Shift");
  if (def.alt) parts.push(isMac ? "⌥" : "Alt");
  const keyLabel =
    def.key === "," || def.key === "[" || def.key === "]" ? def.key : def.key.toUpperCase();
  if (isMac) {
    return parts.join("") + keyLabel;
  }
  return [...parts, keyLabel].join("+");
}
