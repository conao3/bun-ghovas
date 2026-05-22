import { useState, useCallback } from "react";
import { Canvas } from "./Canvas";
import { LayerBar } from "./LayerBar";
import type { WorkspaceState, LayerLevel, LayerUiMode, CanvasState, WindowState } from "../shared/types";

const INITIAL_WORKSPACE: WorkspaceState = {
  layers: {
    0: {
      canvases: [
        {
          id: "canvas-1",
          windows: [
            { id: "w1", kind: "terminal", x: 80, y: 60, width: 420, height: 300, title: "Terminal 1", sessionId: "seed-w1" },
            { id: "w2", kind: "terminal", x: 540, y: 100, width: 400, height: 280, title: "Terminal 2", sessionId: "seed-w2" },
            { id: "w3", kind: "iframe", x: 180, y: 420, width: 460, height: 320, title: "Browser", url: "https://example.com" },
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

  const handleUrlChange = useCallback((id: string, url: string) => {
    setWorkspace((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        0: {
          ...prev.layers[0],
          canvases: prev.layers[0].canvases.map((c) => ({
            ...c,
            windows: c.windows.map((w) => (w.id === id ? { ...w, url } : w)),
          })),
        },
      },
    }));
  }, []);

  const handleUiModeChange = useCallback((level: LayerLevel, mode: LayerUiMode) => {
    setWorkspace((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        [level]: { ...prev.layers[level], uiMode: mode },
      },
    }));
  }, []);

  const handleVisibilityChange = useCallback((level: LayerLevel, visible: boolean) => {
    setWorkspace((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        [level]: { ...prev.layers[level], visible },
      },
    }));
  }, []);

  const activeCanvas =
    workspace.layers[0].canvases.find((c) => c.id === activeIds[0]) ??
    workspace.layers[0].canvases[0]!;

  const handleAddWindow = useCallback(
    (win: WindowState) => {
      const targetId = activeCanvas.id;
      setWorkspace((prev) => ({
        ...prev,
        layers: {
          ...prev.layers,
          0: {
            ...prev.layers[0],
            canvases: prev.layers[0].canvases.map((c) =>
              c.id === targetId ? { ...c, windows: [...c.windows, win] } : c,
            ),
          },
        },
      }));
    },
    [activeCanvas.id],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gridTemplateColumns: "auto 1fr",
        gridTemplateAreas: '"top top" "left center"',
        height: "100vh",
      }}
    >
      <LayerBar
        workspace={workspace}
        activeIds={activeIds}
        onActiveChange={handleActiveChange}
        onUiModeChange={handleUiModeChange}
        onVisibilityChange={handleVisibilityChange}
      />
      <div style={{ gridArea: "center", position: "relative", overflow: "hidden" }}>
        <Canvas canvasState={activeCanvas} onCanvasChange={handleCanvasChange} onUrlChange={handleUrlChange} onAddWindow={handleAddWindow} />
      </div>
    </div>
  );
}
