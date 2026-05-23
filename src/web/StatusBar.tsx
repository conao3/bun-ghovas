import type { WorkspaceState, LayerLevel } from "../shared/types";
import { getActiveL0, getActiveL1, getActiveL2, getActiveL3 } from "./lib/layerTree";
import { SHORTCUTS, formatShortcut } from "./lib/shortcuts";

interface StatusBarProps {
  workspace: WorkspaceState;
  activeIds: Record<LayerLevel, string>;
  activeCanvasWindowCount: number;
  zoom: number;
  focusedWindowTitle: string | null;
  onCycleLayer: (level: LayerLevel) => void;
  onResetZoom: () => void;
}

export function StatusBar({
  workspace,
  activeIds,
  activeCanvasWindowCount,
  zoom,
  focusedWindowTitle,
  onCycleLayer,
  onResetZoom,
}: StatusBarProps) {
  const zoomPct = Math.round(zoom * 100);
  const paletteDef = SHORTCUTS.find((s) => s.id === "toggle-command-palette");
  const settingsDef = SHORTCUTS.find((s) => s.id === "open-settings");

  const l3 = getActiveL3(workspace, activeIds);
  const l2 = getActiveL2(workspace, activeIds);
  const l1 = getActiveL1(workspace, activeIds);
  const l0 = getActiveL0(workspace, activeIds);

  const treeLevels: Array<{ level: LayerLevel; name: string }> = [
    { level: 3, name: l3.name ?? l3.id },
    { level: 2, name: l2.name ?? l2.id },
    { level: 1, name: l1.name ?? l1.id },
    { level: 0, name: `${l0.name ?? l0.id} (${activeCanvasWindowCount})` },
  ];

  return (
    <div
      className="[grid-area:bottom] h-[22px] flex items-center justify-between px-2
        bg-surface-dark border-t border-dark-hairline text-on-dark-soft text-[11px] font-mono select-none"
    >
      <span className="flex gap-1 items-center">
        {treeLevels.map(({ level, name }, idx) => (
          <span key={level} className="flex items-center gap-1">
            {idx > 0 && <span className="text-on-dark-soft/50 select-none">›</span>}
            <button
              aria-label={`cycle L${level} canvas`}
              className="text-on-dark-soft hover:text-on-dark cursor-pointer bg-transparent border-0 p-0 font-mono text-[11px]"
              onClick={() => onCycleLayer(level)}
            >
              {name}
            </button>
          </span>
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
