import type { WorkspaceState, LayerLevel, LayerUiMode } from "../../shared/types";

const LAYER_LEVELS: LayerLevel[] = [1, 2, 3];

const UI_MODE_OPTIONS: { value: LayerUiMode; label: string }[] = [
  { value: "horizontal-tabs", label: "水平タブ" },
  { value: "floating", label: "floating" },
  { value: "vertical-tabs", label: "垂直タブ" },
];

export function LayersPanel(props: {
  workspace: WorkspaceState;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-text-muted-light font-mono mt-0">Layers</h2>
      <table className="border-collapse w-full font-mono">
        <thead>
          <tr>
            <th className="text-white/50 font-mono text-[12px] font-normal text-left pt-1 pr-3 pb-1 pl-0 border-b border-white/10">Layer</th>
            <th className="text-white/50 font-mono text-[12px] font-normal text-left pt-1 pr-3 pb-1 pl-0 border-b border-white/10">UI Mode</th>
            <th className="text-white/50 font-mono text-[12px] font-normal text-left pt-1 pr-3 pb-1 pl-0 border-b border-white/10">Visible</th>
          </tr>
        </thead>
        <tbody>
          {LAYER_LEVELS.map((level) => {
            const layer = props.workspace.layers[level];
            return (
              <tr key={level}>
                <td className="py-[6px] pr-3 pl-0 align-middle border-b border-border-subtle">
                  <span className="text-text-muted-light font-bold">L{level}</span>
                </td>
                <td className="py-[6px] pr-3 pl-0 align-middle border-b border-border-subtle">
                  <select
                    value={layer.uiMode}
                    onChange={(e) => props.onUiModeChange(level, e.target.value as LayerUiMode)}
                    className="bg-white/8 border border-white/15 rounded text-text-muted-light font-mono text-[12px] py-[2px] px-[6px] cursor-pointer"
                  >
                    {UI_MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-[6px] pr-3 pl-0 align-middle border-b border-border-subtle">
                  <input
                    type="checkbox"
                    checked={layer.visible}
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
