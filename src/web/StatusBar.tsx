import type { LayerLevel } from "../shared/types";

interface StatusBarProps {
  activeIds: Record<LayerLevel, string>;
  zoom: number;
  focusedWindowTitle: string | null;
}

export function StatusBar({ activeIds, zoom, focusedWindowTitle }: StatusBarProps) {
  const zoomPct = Math.round(zoom * 100);
  const layerText = `L3:${activeIds[3]}  L2:${activeIds[2]}  L1:${activeIds[1]}  L0:${activeIds[0]}`;

  return (
    <div
      className="[grid-area:bottom] h-[22px] flex items-center justify-between px-2
        bg-surface border-t border-border text-text-muted text-[11px] font-mono select-none"
    >
      <span>{layerText}</span>
      <span>{focusedWindowTitle ?? "—"}</span>
      <span>zoom {zoomPct}%</span>
    </div>
  );
}
