import { useState, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { Modal } from "./components/Modal";
import { TextField } from "./components/TextField";

export interface Command {
  id: string;
  label: string;
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

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlightIndex(0);
    }
  }, [isOpen]);

  const filtered =
    query === ""
      ? commands
      : commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

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
        cmd.run();
        onClose();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
              onClick={() => {
                cmd.run();
                onClose();
              }}
              onMouseEnter={() => setHighlightIndex(i)}
              style={{
                padding: "6px 10px",
                borderRadius: 3,
                cursor: "pointer",
                background: i === highlightIndex ? "rgba(255,255,255,0.12)" : "transparent",
                color: "#ccc",
                fontFamily: "monospace",
                fontSize: 13,
              }}
            >
              {cmd.label}
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
    </Modal>
  );
}
