import { Tabs, TabList, Tab, TabPanel } from "./components/Tabs";
import { Button } from "./components/Button";
import type { WorkspaceState, LayerLevel, LayerState, LayerUiMode } from "../shared/types";

interface LayerBarProps {
  workspace: WorkspaceState;
  activeIds: Record<LayerLevel, string>;
  onActiveChange: (level: LayerLevel, id: string) => void;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
}

function HorizontalStrip({
  level,
  layer,
  activeId,
  isLast,
  onSelectionChange,
  onUiModeChange,
  onVisibilityChange,
}: {
  level: LayerLevel;
  layer: LayerState;
  activeId: string;
  isLast: boolean;
  onSelectionChange: (id: string) => void;
  onUiModeChange: () => void;
  onVisibilityChange: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        style={{
          color: "#555",
          fontSize: 11,
          fontFamily: "monospace",
          padding: "0 4px",
          minWidth: 24,
          userSelect: "none",
        }}
      >
        L{level}
      </span>
      <Button
        variant="ghost"
        onPress={onUiModeChange}
        style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset" }}
      >
        ⇅
      </Button>
      <Button
        variant="ghost"
        onPress={onVisibilityChange}
        style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset" }}
      >
        👁
      </Button>
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
    </div>
  );
}

function VerticalColumn({
  level,
  layer,
  activeId,
  onSelectionChange,
  onUiModeChange,
  onVisibilityChange,
}: {
  level: LayerLevel;
  layer: LayerState;
  activeId: string;
  onSelectionChange: (id: string) => void;
  onUiModeChange: () => void;
  onVisibilityChange: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: "4px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          padding: "0 2px 4px",
        }}
      >
        <span
          style={{
            color: "#555",
            fontSize: 11,
            fontFamily: "monospace",
            userSelect: "none",
          }}
        >
          L{level}
        </span>
        <Button
          variant="ghost"
          onPress={onUiModeChange}
          style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset" }}
        >
          ⇄
        </Button>
        <Button
          variant="ghost"
          onPress={onVisibilityChange}
          style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset" }}
        >
          👁
        </Button>
      </div>
      <Tabs
        selectedKey={activeId}
        onSelectionChange={(key) => onSelectionChange(key as string)}
        orientation="vertical"
      >
        <TabList items={layer.canvases} orientation="vertical">
          {(canvas) => (
            <Tab id={canvas.id} orientation="vertical">
              {canvas.id}
            </Tab>
          )}
        </TabList>
        {layer.canvases.map((c) => (
          <TabPanel key={c.id} id={c.id} style={{ padding: 0 }} />
        ))}
      </Tabs>
    </div>
  );
}

export function LayerBar({
  workspace,
  activeIds,
  onActiveChange,
  onUiModeChange,
  onVisibilityChange,
}: LayerBarProps) {
  const allLevels: LayerLevel[] = [3, 2, 1];

  const horizontalLevels = allLevels.filter(
    (l) => workspace.layers[l].visible && workspace.layers[l].uiMode === "horizontal-tabs",
  );
  const verticalLevels = allLevels.filter(
    (l) => workspace.layers[l].visible && workspace.layers[l].uiMode === "vertical-tabs",
  );
  const hiddenLevels = allLevels.filter((l) => !workspace.layers[l].visible);

  const cycleMode = (level: LayerLevel) => {
    const next: LayerUiMode =
      workspace.layers[level].uiMode === "horizontal-tabs" ? "vertical-tabs" : "horizontal-tabs";
    onUiModeChange(level, next);
  };

  return (
    <>
      <div
        style={{
          gridArea: "top",
          background: "#1e1e1e",
          borderBottom:
            horizontalLevels.length > 0 ? "1px solid rgba(255,255,255,0.12)" : undefined,
          flexShrink: 0,
        }}
      >
        {horizontalLevels.map((level, i) => (
          <HorizontalStrip
            key={level}
            level={level}
            layer={workspace.layers[level]}
            activeId={activeIds[level]}
            isLast={i === horizontalLevels.length - 1}
            onSelectionChange={(id) => onActiveChange(level, id)}
            onUiModeChange={() => cycleMode(level)}
            onVisibilityChange={() => onVisibilityChange(level, false)}
          />
        ))}
      </div>
      <div
        style={{
          gridArea: "left",
          background: "#1e1e1e",
          borderRight:
            verticalLevels.length > 0 ? "1px solid rgba(255,255,255,0.12)" : undefined,
          display: "flex",
          flexDirection: "row",
        }}
      >
        {verticalLevels.map((level) => (
          <VerticalColumn
            key={level}
            level={level}
            layer={workspace.layers[level]}
            activeId={activeIds[level]}
            onSelectionChange={(id) => onActiveChange(level, id)}
            onUiModeChange={() => cycleMode(level)}
            onVisibilityChange={() => onVisibilityChange(level, false)}
          />
        ))}
      </div>
      {hiddenLevels.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 4,
            right: 4,
            display: "flex",
            gap: 4,
            zIndex: 100,
          }}
        >
          {hiddenLevels.map((level) => (
            <Button
              key={level}
              variant="secondary"
              onPress={() => onVisibilityChange(level, true)}
              style={{ padding: "2px 8px", fontSize: 10 }}
            >
              show L{level}
            </Button>
          ))}
        </div>
      )}
    </>
  );
}
