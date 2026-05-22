import { useState } from "react";
import { Canvas } from "./Canvas";
import { LayerBar } from "./LayerBar";
import type { WorkspaceState, LayerLevel } from "../shared/types";

const INITIAL_WORKSPACE: WorkspaceState = {
  layers: {
    0: {
      canvases: [
        { id: "canvas-1", windows: [], panX: 0, panY: 0, zoom: 1 },
        { id: "canvas-2", windows: [], panX: 0, panY: 0, zoom: 1 },
      ],
      uiMode: "horizontal-tabs",
      visible: true,
    },
    1: {
      canvases: [
        { id: "alpha", windows: [], panX: 0, panY: 0, zoom: 1 },
        { id: "beta", windows: [], panX: 0, panY: 0, zoom: 1 },
      ],
      uiMode: "horizontal-tabs",
      visible: true,
    },
    2: {
      canvases: [
        { id: "ui", windows: [], panX: 0, panY: 0, zoom: 1 },
        { id: "api", windows: [], panX: 0, panY: 0, zoom: 1 },
      ],
      uiMode: "horizontal-tabs",
      visible: true,
    },
    3: {
      canvases: [
        { id: "main", windows: [], panX: 0, panY: 0, zoom: 1 },
        { id: "docs", windows: [], panX: 0, panY: 0, zoom: 1 },
      ],
      uiMode: "horizontal-tabs",
      visible: true,
    },
  },
};

const INITIAL_ACTIVE: Record<LayerLevel, string> = {
  0: "canvas-1",
  1: "alpha",
  2: "ui",
  3: "main",
};

export function App() {
  const [workspace] = useState<WorkspaceState>(INITIAL_WORKSPACE);
  const [activeIds, setActiveIds] = useState<Record<LayerLevel, string>>(INITIAL_ACTIVE);

  const handleActiveChange = (level: LayerLevel, id: string) => {
    setActiveIds((prev) => {
      const next = { ...prev, [level]: id };
      if (level === 3) {
        next[2] = workspace.layers[2].canvases[0]?.id ?? prev[2];
        next[1] = workspace.layers[1].canvases[0]?.id ?? prev[1];
      } else if (level === 2) {
        next[1] = workspace.layers[1].canvases[0]?.id ?? prev[1];
      }
      return next;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <LayerBar
        workspace={workspace}
        activeIds={activeIds}
        onActiveChange={handleActiveChange}
      />
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Canvas key={activeIds[1]} />
      </div>
    </div>
  );
}
