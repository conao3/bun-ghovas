import { useState, useEffect } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";
import { History, AppWindow, Layers, LayoutGrid, Settings, Hash } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "./components/Modal";
import { SHORTCUTS, formatShortcut } from "./lib/shortcuts";

const LS_KEY = "ghovas.recentCommands";
const MAX_RECENT = 8;
const CATEGORY_ORDER = ["Window", "Layer", "Workspace", "Settings"];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Recent: History,
  Window: AppWindow,
  Layer: Layers,
  Workspace: LayoutGrid,
  Settings: Settings,
};

function loadRecentCommands(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function saveRecentCommands(recentIds: string[], id: string): string[] {
  const next = [id, ...recentIds.filter((x) => x !== id)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — continue without persisting
  }
  return next;
}

export interface Command {
  id: string;
  label: string;
  category: string;
  confirm?: string;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

type DisplayRow =
  | { type: "header"; label: string }
  | { type: "item"; cmd: Command; itemIndex: number };

function buildCategoryRows(commands: Command[], recentIds: string[]): DisplayRow[] {
  const rows: DisplayRow[] = [];
  let itemIndex = 0;

  const recentItems = recentIds.flatMap((id) => {
    const cmd = commands.find((c) => c.id === id);
    return cmd ? [cmd] : [];
  });

  if (recentItems.length > 0) {
    rows.push({ type: "header", label: "Recent" });
    for (const cmd of recentItems) {
      rows.push({ type: "item", cmd, itemIndex: itemIndex++ });
    }
  }

  const recentSet = new Set(recentIds);
  const nonRecent = commands.filter((c) => !recentSet.has(c.id));
  const presentCategories = [...new Set(nonRecent.map((c) => c.category))];
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((cat) => presentCategories.includes(cat)),
    ...presentCategories.filter((cat) => !CATEGORY_ORDER.includes(cat)),
  ];

  for (const category of orderedCategories) {
    const catCmds = nonRecent.filter((c) => c.category === category);
    if (catCmds.length === 0) continue;
    rows.push({ type: "header", label: category });
    for (const cmd of catCmds) {
      rows.push({ type: "item", cmd, itemIndex: itemIndex++ });
    }
  }

  return rows;
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecentCommands());
  const [pendingConfirm, setPendingConfirm] = useState<Command | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlightIndex(0);
      setRecentIds(loadRecentCommands());
      setPendingConfirm(null);
    }
  }, [isOpen]);

  const isSearching = query !== "";
  const searchResults = isSearching
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : [];
  const categoryRows = isSearching ? [] : buildCategoryRows(commands, recentIds);
  const categoryItems = categoryRows.filter(
    (r): r is { type: "item"; cmd: Command; itemIndex: number } => r.type === "item",
  );
  const itemCount = isSearching ? searchResults.length : categoryItems.length;

  const activeDescendant =
    itemCount > 0 && highlightIndex >= 0 && highlightIndex < itemCount
      ? isSearching
        ? `cmd-option-${searchResults[highlightIndex].id}`
        : categoryItems[highlightIndex]
          ? `cmd-option-${categoryItems[highlightIndex].cmd.id}`
          : undefined
      : undefined;

  const runCommand = (cmd: Command) => {
    if (cmd.confirm) {
      setPendingConfirm(cmd);
      return;
    }
    setRecentIds((prev) => saveRecentCommands(prev, cmd.id));
    cmd.run();
    onClose();
  };

  const handleConfirm = () => {
    if (!pendingConfirm) return;
    setRecentIds((prev) => saveRecentCommands(prev, pendingConfirm.id));
    pendingConfirm.run();
    onClose();
  };

  const handleCancel = () => {
    setPendingConfirm(null);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setHighlightIndex(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, itemCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = isSearching ? searchResults[highlightIndex] : categoryItems[highlightIndex]?.cmd;
      if (cmd) runCommand(cmd);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Command palette">
      {pendingConfirm ? (
        <div className="w-[440px]">
          <div className="text-on-dark-strong font-mono text-[13px] mb-4 leading-[1.5]">
            {pendingConfirm.confirm}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="py-[5px] px-[14px] rounded-[3px] border border-white/20 bg-transparent text-on-dark-strong font-mono text-[13px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              autoFocus
              onClick={handleConfirm}
              className="py-[5px] px-[14px] rounded-[3px] border-0 bg-error text-white font-mono text-[13px] cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>
      ) : (
        <div onKeyDown={handleKeyDown}>
          <input
            autoFocus
            role="combobox"
            aria-autocomplete="list"
            aria-controls="command-palette-listbox"
            aria-expanded={itemCount > 0}
            aria-activedescendant={activeDescendant}
            aria-label="Search commands"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="bg-black/40 border border-white/15 rounded-[3px] text-on-dark-strong font-mono text-[12px] py-[3px] px-2 outline-none w-[440px]"
          />
          <div className="mt-2 max-h-[320px] overflow-y-auto">
            {isSearching ? (
              <>
                <ul
                  role="listbox"
                  id="command-palette-listbox"
                  aria-label="Command suggestions"
                  className="list-none p-0 m-0"
                >
                  {searchResults.map((cmd, i) => (
                    <li
                      key={cmd.id}
                      id={`cmd-option-${cmd.id}`}
                      role="option"
                      aria-selected={i === highlightIndex}
                      onClick={() => runCommand(cmd)}
                      onMouseEnter={() => setHighlightIndex(i)}
                      className={clsx(
                        "px-[10px] py-[6px] rounded-[3px] cursor-pointer text-on-dark-strong font-mono text-[13px] flex justify-between items-center",
                        i === highlightIndex ? "bg-white/12" : "bg-transparent",
                      )}
                    >
                      <span>{cmd.label}</span>
                      {(() => {
                        const def = SHORTCUTS.find((s) => s.id === cmd.id);
                        return def ? (
                          <span className="text-white/40 ml-4">{formatShortcut(def)}</span>
                        ) : null;
                      })()}
                    </li>
                  ))}
                </ul>
                {searchResults.length === 0 && (
                  <div className="px-[10px] py-[6px] text-white/40 font-mono text-[13px]">
                    No commands found
                  </div>
                )}
              </>
            ) : (
              <>
                <ul
                  role="listbox"
                  id="command-palette-listbox"
                  aria-label="Command suggestions"
                  className="list-none p-0 m-0"
                >
                  {categoryRows.map((row) =>
                    row.type === "header" ? (
                      <li
                        key={`header-${row.label}`}
                        role="presentation"
                        className="text-on-dark-muted text-[11px] font-mono px-3 pt-1 pb-0.5 flex items-center gap-1.5"
                      >
                        {(() => {
                          const Icon = CATEGORY_ICONS[row.label] ?? Hash;
                          return <Icon size={12} aria-hidden />;
                        })()}
                        {row.label}
                      </li>
                    ) : (
                      <li
                        key={row.cmd.id}
                        id={`cmd-option-${row.cmd.id}`}
                        role="option"
                        aria-selected={row.itemIndex === highlightIndex}
                        onClick={() => runCommand(row.cmd)}
                        onMouseEnter={() => setHighlightIndex(row.itemIndex)}
                        className={clsx(
                          "px-[10px] py-[6px] rounded-[3px] cursor-pointer text-on-dark-strong font-mono text-[13px] flex justify-between items-center",
                          row.itemIndex === highlightIndex ? "bg-white/12" : "bg-transparent",
                        )}
                      >
                        <span>{row.cmd.label}</span>
                        {(() => {
                          const def = SHORTCUTS.find((s) => s.id === row.cmd.id);
                          return def ? (
                            <span className="text-white/40 ml-4">{formatShortcut(def)}</span>
                          ) : null;
                        })()}
                      </li>
                    ),
                  )}
                </ul>
                {categoryItems.length === 0 && (
                  <div className="px-[10px] py-[6px] text-white/40 font-mono text-[13px]">
                    No commands found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
