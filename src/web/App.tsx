import { useState, useCallback } from "react";
import { Canvas } from "./Canvas";
import { LayerBar } from "./LayerBar";
import type { WorkspaceState, LayerLevel, CanvasState } from "../shared/types";

const INITIAL_WORKSPACE: WorkspaceState = {
  layers: {
    0: {
      canvases: [
        {
          id: "canvas-1",
          windows: [
            { id: "w1", kind: "terminal", x: 80, y: 60, width: 420, height: 300, title: "Terminal 1" },
            { id: "w2", kind: "terminal", x: 540, y: 100, width: 400, height: 280, title: "Terminal 2" },
            { id: "w3", kind: "iframe", x: 180, y: 420, width: 460, height: 320, title: "Browser" },
          ],
          panX: 0,
          panY: 0,
          zoom: 1,
        },
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
  const [workspace, setWorkspace] = useState<WorkspaceState>(INITIAL_WORKSPACE);
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

  const handleCanvasChange = useCallback((next: CanvasState) => {
    setWorkspace((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        0: {
          ...prev.layers[0],
          canvases: prev.layers[0].canvases.map((c) => (c.id === next.id ? next : c)),
        },
      },
    }));
  }, []);

  const activeCanvas =
    workspace.layers[0].canvases.find((c) => c.id === activeIds[0]) ??
    workspace.layers[0].canvases[0]!;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <LayerBar
        workspace={workspace}
        activeIds={activeIds}
        onActiveChange={handleActiveChange}
      />
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Canvas canvasState={activeCanvas} onCanvasChange={handleCanvasChange} />
      </div>
    </div>
  );
}
