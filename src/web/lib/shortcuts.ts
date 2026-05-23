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
