import type { LayerLevel } from "../shared/types";
import { SHORTCUTS, formatShortcut } from "./lib/shortcuts";

interface StatusBarProps {
  activeIds: Record<LayerLevel, string>;
  zoom: number;
  focusedWindowTitle: string | null;
}

export function StatusBar({ activeIds, zoom, focusedWindowTitle }: StatusBarProps) {
  const zoomPct = Math.round(zoom * 100);
  const layerText = `L3:${activeIds[3]}  L2:${activeIds[2]}  L1:${activeIds[1]}  L0:${activeIds[0]}`;
  const paletteDef = SHORTCUTS.find((s) => s.id === "toggle-command-palette");
  const settingsDef = SHORTCUTS.find((s) => s.id === "open-settings");

  return (
    <div
      className="[grid-area:bottom] h-[22px] flex items-center justify-between px-2
        bg-surface border-t border-border text-text-muted text-[11px] font-mono select-none"
    >
      <span>{layerText}</span>
      <span>{focusedWindowTitle ?? "—"}</span>
      <span className="flex gap-3 whitespace-nowrap">
        <span>zoom {zoomPct}%</span>
        {paletteDef && <span>{formatShortcut(paletteDef)} palette</span>}
        {settingsDef && <span>{formatShortcut(settingsDef)} settings</span>}
      </span>
    </div>
  );
}
