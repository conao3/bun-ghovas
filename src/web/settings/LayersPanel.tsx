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
      <h2 style={{ color: "#ccc", fontFamily: "monospace", marginTop: 0 }}>Layers</h2>
      <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: "monospace" }}>
        <thead>
          <tr>
            <th style={thStyle}>Layer</th>
            <th style={thStyle}>UI Mode</th>
            <th style={thStyle}>Visible</th>
          </tr>
        </thead>
        <tbody>
          {LAYER_LEVELS.map((level) => {
            const layer = props.workspace.layers[level];
            return (
              <tr key={level}>
                <td style={tdStyle}>
                  <span style={{ color: "#ccc", fontWeight: "bold" }}>L{level}</span>
                </td>
                <td style={tdStyle}>
                  <select
                    value={layer.uiMode}
                    onChange={(e) =>
                      props.onUiModeChange(level, e.target.value as LayerUiMode)
                    }
                    style={selectStyle}
                  >
                    {UI_MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={(e) => props.onVisibilityChange(level, e.target.checked)}
                    style={{ cursor: "pointer", accentColor: "#888" }}
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

const thStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.5)",
  fontFamily: "monospace",
  fontSize: 12,
  fontWeight: "normal",
  textAlign: "left",
  padding: "4px 12px 4px 0",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const tdStyle: React.CSSProperties = {
  padding: "6px 12px 6px 0",
  verticalAlign: "middle",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const selectStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 4,
  color: "#ccc",
  fontFamily: "monospace",
  fontSize: 12,
  padding: "2px 6px",
  cursor: "pointer",
};
