import type { LayerLevel } from "../shared/types";
import { SHORTCUTS, formatShortcut } from "./lib/shortcuts";

interface StatusBarProps {
  activeIds: Record<LayerLevel, string>;
  zoom: number;
  focusedWindowTitle: string | null;
  onCycleLayer: (level: LayerLevel) => void;
  onResetZoom: () => void;
}

export function StatusBar({ activeIds, zoom, focusedWindowTitle, onCycleLayer, onResetZoom }: StatusBarProps) {
  const zoomPct = Math.round(zoom * 100);
  const paletteDef = SHORTCUTS.find((s) => s.id === "toggle-command-palette");
  const settingsDef = SHORTCUTS.find((s) => s.id === "open-settings");

  return (
    <div
      className="[grid-area:bottom] h-[22px] flex items-center justify-between px-2
        bg-surface-dark border-t border-dark-hairline text-on-dark-soft text-[11px] font-mono select-none"
    >
      <span className="flex gap-2">
        {([3, 2, 1, 0] as LayerLevel[]).map((level) => (
          <button
            key={level}
            aria-label={`cycle L${level} canvas`}
            className="text-on-dark-soft hover:text-on-dark cursor-pointer bg-transparent border-0 p-0 font-mono text-[11px]"
            onClick={() => onCycleLayer(level)}
          >
            L{level}:{activeIds[level]}
          </button>
        ))}
      </span>
      <span>{focusedWindowTitle ?? "—"}</span>
      <span className="flex gap-3 whitespace-nowrap">
        <button
          aria-label="reset zoom"
          className="text-on-dark-soft hover:text-on-dark cursor-pointer bg-transparent border-0 p-0 font-mono text-[11px]"
          onClick={onResetZoom}
        >
          zoom {zoomPct}%
        </button>
        {paletteDef && <span>{formatShortcut(paletteDef)} palette</span>}
        {settingsDef && <span>{formatShortcut(settingsDef)} settings</span>}
      </span>
    </div>
  );
}
