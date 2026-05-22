import type { WorkspaceState, LayerLevel, LayerUiMode } from "../../shared/types";

export function LayersPanel(props: {
  workspace: WorkspaceState;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
}) {
  return (
    <div>
      <h2 style={{ color: "#ccc", fontFamily: "monospace", marginTop: 0 }}>Layers</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontSize: 13 }}>Coming soon</p>
    </div>
  );
}
