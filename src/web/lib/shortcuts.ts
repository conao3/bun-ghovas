export type ShortcutDef = {
  id: string;
  label: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
};

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
];

export function matchesShortcut(e: KeyboardEvent, def: ShortcutDef): boolean {
  return (
    (e.metaKey || e.ctrlKey) === def.mod &&
    e.shiftKey === def.shift &&
    e.altKey === def.alt &&
    e.key.toLowerCase() === def.key.toLowerCase()
  );
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export function formatShortcut(def: ShortcutDef): string {
  const parts: string[] = [];
  if (def.mod) parts.push(isMac ? "⌘" : "Ctrl");
  if (def.shift) parts.push(isMac ? "⇧" : "Shift");
  if (def.alt) parts.push(isMac ? "⌥" : "Alt");
  const keyLabel = def.key === "," ? "," : def.key.toUpperCase();
  if (isMac) {
    return parts.join("") + keyLabel;
  }
  return [...parts, keyLabel].join("+");
}
