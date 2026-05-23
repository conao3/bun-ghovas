import { Layers } from "lucide-react";
import type { WorkspaceState, LayerLevel, LayerUiMode } from "../../shared/types";
import { getActiveL2, getActiveL3 } from "../lib/layerTree";
import { PanelHeader } from "./PanelHeader";

const LAYER_LEVELS: LayerLevel[] = [1, 2, 3];

const UI_MODE_OPTIONS: { value: LayerUiMode; label: string }[] = [
  { value: "horizontal-tabs", label: "水平タブ" },
  { value: "floating", label: "floating" },
  { value: "vertical-tabs", label: "垂直タブ" },
];

export function LayersPanel(props: {
  workspace: WorkspaceState;
  activeIds: Record<LayerLevel, string>;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
}) {
  const { workspace, activeIds } = props;

  function canvasCount(level: LayerLevel): number {
    if (level === 3) return workspace.l3.length;
    if (level === 2) {
      const l3 = getActiveL3(workspace, activeIds);
      return workspace.l2.filter((n) => n.parentL3 === l3.id).length;
    }
    const l2 = getActiveL2(workspace, activeIds);
    return workspace.l1.filter((n) => n.parentL2 === l2.id).length;
  }

  return (
    <div>
      <PanelHeader icon={Layers} title="Layers" />
      <table className="border-collapse w-full font-mono">
        <thead>
          <tr>
            <th className="text-muted font-mono text-[12px] font-normal text-left pt-1 pr-3 pb-1 pl-0 border-b border-hairline">
              Layer
            </th>
            <th className="text-muted font-mono text-[12px] font-normal text-left pt-1 pr-3 pb-1 pl-0 border-b border-hairline">
              UI Mode
            </th>
            <th className="text-muted font-mono text-[12px] font-normal text-left pt-1 pr-3 pb-1 pl-0 border-b border-hairline">
              Visible
            </th>
          </tr>
        </thead>
        <tbody>
          {LAYER_LEVELS.map((level) => {
            const config = workspace.layerConfig[level];
            const count = canvasCount(level);
            return (
              <tr key={level}>
                <td className="py-[6px] pr-3 pl-0 align-middle border-b border-hairline">
                  <span className="text-ink font-bold">L{level}</span>
                  <span className="ml-2 text-muted text-[11px]">
                    {count} {count === 1 ? "canvas" : "canvases"}
                  </span>
                </td>
                <td className="py-[6px] pr-3 pl-0 align-middle border-b border-hairline">
                  <select
                    value={config.uiMode}
                    onChange={(e) => props.onUiModeChange(level, e.target.value as LayerUiMode)}
                    className="bg-surface-soft border border-hairline rounded text-ink font-mono text-[12px] py-[2px] px-[6px] cursor-pointer"
                  >
                    {UI_MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-[6px] pr-3 pl-0 align-middle border-b border-hairline">
                  <input
                    type="checkbox"
                    checked={config.visible}
                    onChange={(e) => props.onVisibilityChange(level, e.target.checked)}
                    className="cursor-pointer accent-text-muted"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
