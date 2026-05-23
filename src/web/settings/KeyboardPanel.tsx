import { useState, useEffect, useCallback } from "react";
import { Keyboard, Search, RotateCcw } from "lucide-react";
import {
  SHORTCUTS,
  formatShortcut,
  loadOverrides,
  saveOverride,
  clearOverride,
  clearAllOverrides,
  normalizeCombo,
  eventToCombo,
  shortcutDefToCombo,
  parseComboToFields,
} from "../lib/shortcuts";
import type { ShortcutDef } from "../lib/shortcuts";
import { useToast } from "../lib/toast";
import { TextField } from "../components/TextField";
import { PanelHeader } from "./PanelHeader";

function matchesQuery(def: ShortcutDef, query: string): boolean {
  const q = query.toLowerCase();
  return def.label.toLowerCase().includes(q) || formatShortcut(def).toLowerCase().includes(q);
}

function findConflict(
  newCombo: string,
  capturingId: string,
  overrides: Record<string, string>,
): ShortcutDef | null {
  const normalized = normalizeCombo(newCombo);
  for (const def of SHORTCUTS) {
    if (def.id === capturingId) continue;
    const effectiveCombo = overrides[def.id]
      ? normalizeCombo(overrides[def.id]!)
      : shortcutDefToCombo(def);
    if (effectiveCombo === normalized) return def;
  }
  return null;
}

export function KeyboardPanel() {
  const [query, setQuery] = useState<string>("");
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>(loadOverrides);
  const toast = useToast();

  const filtered = SHORTCUTS.filter((def) => matchesQuery(def, query));

  const cancelCapture = useCallback(() => {
    setCapturingId(null);
    setConflictMsg(null);
  }, []);

  useEffect(() => {
    if (capturingId == null) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) return;

      if (e.key === "Escape") {
        cancelCapture();
        return;
      }

      if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) return;

      const combo = normalizeCombo(eventToCombo(e));
      const conflict = findConflict(combo, capturingId, overrides);

      if (conflict) {
        setConflictMsg(`conflicts with: ${conflict.label}`);
        return;
      }

      try {
        saveOverride(capturingId, combo);
        setOverrides(loadOverrides());
        setCapturingId(null);
        setConflictMsg(null);
      } catch (err) {
        toast.show(
          "warning",
          "Failed to save shortcut: " + (err instanceof Error ? err.message : "storage error"),
        );
        cancelCapture();
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [capturingId, overrides, cancelCapture, toast]);

  const handleResetOne = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    clearOverride(id);
    setOverrides(loadOverrides());
  }, []);

  const handleResetAll = useCallback(() => {
    clearAllOverrides();
    setOverrides({});
  }, []);

  const hasAnyOverride = Object.keys(overrides).length > 0;

  return (
    <div>
      <PanelHeader icon={Keyboard} title="Keyboard" />
      <div className="flex items-center gap-2 mb-3">
        <Search size={14} className="text-muted shrink-0" />
        <TextField label="Search" value={query} onChange={setQuery} />
      </div>
      <table className="w-full border-collapse font-mono text-[13px]">
        <tbody>
          {filtered.map((def) => {
            const isCapturing = capturingId === def.id;
            const hasOverride = overrides[def.id] != null;
            const effectiveDef = hasOverride
              ? { ...def, ...parseComboToFields(overrides[def.id]!) }
              : def;

            return (
              <tr
                key={def.id}
                className={`border-b border-hairline cursor-pointer select-none ${
                  isCapturing ? "bg-primary/20" : "hover:bg-surface-cream-strong/40"
                }`}
                onClick={() => {
                  if (!isCapturing) {
                    setCapturingId(def.id);
                    setConflictMsg(null);
                  }
                }}
              >
                <td className="text-body py-[6px] px-0 w-full">
                  {def.label}
                  {isCapturing && conflictMsg && (
                    <div className="text-error text-xs mt-0.5">{conflictMsg}</div>
                  )}
                </td>
                <td className="text-right py-[6px] px-0 whitespace-nowrap">
                  {isCapturing ? (
                    <span className="text-muted italic">press the new shortcut…</span>
                  ) : (
                    <span
                      className={
                        hasOverride ? "text-primary" : "text-ink tracking-[0.05em]"
                      }
                    >
                      {formatShortcut(effectiveDef)}
                    </span>
                  )}
                </td>
                <td className="py-[6px] pl-2 px-0 whitespace-nowrap">
                  {!isCapturing && hasOverride && (
                    <button
                      className="text-muted-soft hover:text-error"
                      title="Reset to default"
                      onClick={(e) => handleResetOne(e, def.id)}
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasAnyOverride && (
        <div className="mt-4 flex justify-end">
          <button
            className="text-xs text-muted hover:text-error"
            onClick={handleResetAll}
          >
            Reset all
          </button>
        </div>
      )}
    </div>
  );
}
