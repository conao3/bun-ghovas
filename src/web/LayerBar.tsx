import { Tabs, TabList, Tab, TabPanel } from "./components/Tabs";
import type { WorkspaceState, LayerLevel, LayerState } from "../shared/types";

interface LayerBarProps {
  workspace: WorkspaceState;
  activeIds: Record<LayerLevel, string>;
  onActiveChange: (level: LayerLevel, id: string) => void;
}

function LayerStrip({
  layer,
  activeId,
  onSelectionChange,
}: {
  layer: LayerState;
  activeId: string;
  onSelectionChange: (id: string) => void;
}) {
  return (
    <Tabs
      selectedKey={activeId}
      onSelectionChange={(key) => onSelectionChange(key as string)}
      style={{ flex: 1 }}
    >
      <TabList items={layer.canvases}>
        {(canvas) => <Tab id={canvas.id}>{canvas.id}</Tab>}
      </TabList>
      {layer.canvases.map((c) => (
        <TabPanel key={c.id} id={c.id} style={{ padding: 0 }} />
      ))}
    </Tabs>
  );
}

export function LayerBar({ workspace, activeIds, onActiveChange }: LayerBarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#1e1e1e",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}
    >
      {([3, 2, 1] as LayerLevel[]).map((level) => (
        <div
          key={level}
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: level > 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          <span
            style={{
              color: "#555",
              fontSize: 11,
              fontFamily: "monospace",
              padding: "0 8px",
              minWidth: 28,
              userSelect: "none",
            }}
          >
            L{level}
          </span>
          <LayerStrip
            layer={workspace.layers[level]}
            activeId={activeIds[level]}
            onSelectionChange={(id) => onActiveChange(level, id)}
          />
        </div>
      ))}
    </div>
  );
}
