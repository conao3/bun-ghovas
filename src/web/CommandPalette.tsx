import { useState, useEffect } from "react";
import type { KeyboardEvent } from "react";
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
        <div style={{ width: 440 }}>
          <div
            style={{
              color: "#ccc",
              fontFamily: "monospace",
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            {pendingConfirm.confirm}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={handleCancel}
              style={{
                padding: "5px 14px",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#ccc",
                fontFamily: "monospace",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              autoFocus
              onClick={handleConfirm}
              style={{
                padding: "5px 14px",
                borderRadius: 3,
                border: "none",
                background: "#c0392b",
                color: "#fff",
                fontFamily: "monospace",
                fontSize: 13,
                cursor: "pointer",
              }}
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
            style={{ width: 440 }}
          />
          <div style={{ marginTop: 8, maxHeight: 320, overflowY: "auto" }}>
            {filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                onClick={() => runCommand(cmd)}
                onMouseEnter={() => setHighlightIndex(i)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 3,
                  cursor: "pointer",
                  background: i === highlightIndex ? "rgba(255,255,255,0.12)" : "transparent",
                  color: "#ccc",
                  fontFamily: "monospace",
                  fontSize: 13,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{cmd.label}</span>
                {(() => {
                  const def = SHORTCUTS.find((s) => s.id === cmd.id);
                  return def ? (
                    <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 16 }}>
                      {formatShortcut(def)}
                    </span>
                  ) : null;
                })()}
              </div>
            ))}
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "6px 10px",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "monospace",
                  fontSize: 13,
                }}
              >
                No commands found
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
