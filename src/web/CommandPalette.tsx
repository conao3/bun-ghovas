import { useState, useEffect } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";
import { Modal } from "./components/Modal";
import { TextField } from "./components/TextField";
import { SHORTCUTS, formatShortcut } from "./lib/shortcuts";

const LS_KEY = "ghovas.recentCommands";
const MAX_RECENT = 8;

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
  confirm?: string;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
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

  const filtered =
    query === ""
      ? [
          ...recentIds.flatMap((id) => {
            const cmd = commands.find((c) => c.id === id);
            return cmd ? [cmd] : [];
          }),
          ...commands.filter((c) => !recentIds.includes(c.id)),
        ]
      : commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

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
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[highlightIndex];
      if (cmd) {
        runCommand(cmd);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {pendingConfirm ? (
        <div className="w-[440px]">
          <div className="text-text-muted-light font-mono text-[13px] mb-4 leading-[1.5]">
            {pendingConfirm.confirm}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="py-[5px] px-[14px] rounded-[3px] border border-white/20 bg-transparent text-text-muted-light font-mono text-[13px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              autoFocus
              onClick={handleConfirm}
              className="py-[5px] px-[14px] rounded-[3px] border-0 bg-danger text-white font-mono text-[13px] cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>
      ) : (
        <div onKeyDown={handleKeyDown}>
          <TextField
            autoFocus
            value={query}
            onChange={handleQueryChange}
            aria-label="コマンド検索"
            className="w-[440px]"
          />
          <div className="mt-2 max-h-[320px] overflow-y-auto">
            {filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                onClick={() => runCommand(cmd)}
                onMouseEnter={() => setHighlightIndex(i)}
                className={clsx(
                  "px-[10px] py-[6px] rounded-[3px] cursor-pointer text-text-muted-light font-mono text-[13px] flex justify-between items-center",
                  i === highlightIndex ? "bg-white/12" : "bg-transparent",
                )}
              >
                <span>{cmd.label}</span>
                {(() => {
                  const def = SHORTCUTS.find((s) => s.id === cmd.id);
                  return def ? (
                    <span className="text-white/40 ml-4">
                      {formatShortcut(def)}
                    </span>
                  ) : null;
                })()}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-[10px] py-[6px] text-white/40 font-mono text-[13px]">
                No commands found
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
