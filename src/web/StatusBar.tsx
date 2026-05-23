import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";
import type { WorkspaceState, LayerLevel } from "../shared/types";
import { getActiveL0, getActiveL1, getActiveL2, getActiveL3 } from "./lib/layerTree";
import { SHORTCUTS, formatShortcut } from "./lib/shortcuts";

const ZOOM_STEPS = [
  { value: 0.25, label: "25%" },
  { value: 0.5, label: "50%" },
  { value: 1.0, label: "100%" },
  { value: 2.0, label: "200%" },
] as const;

interface StatusBarProps {
  workspace: WorkspaceState;
  activeIds: Record<LayerLevel, string>;
  activeCanvasWindowCount: number;
  zoom: number;
  focusedWindowTitle: string | null;
  onCycleLayer: (level: LayerLevel) => void;
  onSetZoom: (zoom: number) => void;
}

export function StatusBar({
  workspace,
  activeIds,
  activeCanvasWindowCount,
  zoom,
  focusedWindowTitle,
  onCycleLayer,
  onSetZoom,
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
        <DialogTrigger>
          <Button
            aria-label="zoom level"
            className="text-on-dark-soft hover:text-on-dark cursor-pointer bg-transparent border-0 p-0 font-mono text-[11px] outline-none"
          >
            zoom {zoomPct}%
          </Button>
          <Popover
            placement="top"
            className="bg-surface-dark border border-white/15 rounded py-1 min-w-[80px] outline-none shadow-[0_4px_16px_color-mix(in_srgb,black_50%,transparent)]"
          >
            <Dialog className="outline-none flex flex-col">
              {({ close }) =>
                ZOOM_STEPS.map((step) => {
                  const active = Math.round(step.value * 100) === Math.round(zoom * 100);
                  return (
                    <Button
                      key={step.value}
                      className={`py-1.5 px-3.5 text-[11px] font-mono bg-transparent cursor-default outline-none select-none text-left
                        ${active ? "text-white font-bold" : "text-on-dark-soft"}
                        data-[hovered]:text-white data-[hovered]:bg-surface-dark-soft`}
                      onPress={() => {
                        onSetZoom(step.value);
                        close();
                      }}
                    >
                      {active ? "• " : "  "}
                      {step.label}
                    </Button>
                  );
                })
              }
            </Dialog>
          </Popover>
        </DialogTrigger>
        {paletteDef && <span>{formatShortcut(paletteDef)} palette</span>}
        {settingsDef && <span>{formatShortcut(settingsDef)} settings</span>}
      </span>
    </div>
  );
}
