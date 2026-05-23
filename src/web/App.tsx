import { useState, useCallback, useEffect, useMemo } from "react";
import { TerminalSessionCtx } from "./SessionPicker";
import type { TerminalSessionCtxValue } from "./SessionPicker";
import { Canvas } from "./Canvas";
import { LayerBar } from "./LayerBar";
import { StatusBar } from "./StatusBar";
import { CommandPalette } from "./CommandPalette";
import type { Command } from "./CommandPalette";
import type {
  WorkspaceState,
  LayerLevel,
  LayerUiMode,
  CanvasStateV2,
  WorkspaceNode,
} from "../shared/types";
import { useWorkspacePersistence } from "./lib/useWorkspacePersistence";
import { Settings } from "./Settings";
import { Welcome } from "./Welcome";
import { TutorialOverlay } from "./TutorialOverlay";
import { SHORTCUTS, matchesShortcut } from "./lib/shortcuts";

function readOnboarded(): boolean {
  try {
    return localStorage.getItem("ghovas.onboarded") === "true";
  } catch {
    return true;
  }
}

function readTutorialSeen(): boolean {
  try {
    return localStorage.getItem("ghovas.tutorialSeen") === "true";
  } catch {
    return true;
  }
}

export const INITIAL_WORKSPACE: WorkspaceState = {
  layers: {
    0: {
      canvases: [
        {
          id: "canvas-1",
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: [
            {
              id: "w1",
              type: "window",
              position: { x: 60, y: 40 },
              width: 440,
              height: 300,
              data: {
                id: "w1",
                kind: "terminal",
                x: 60,
                y: 40,
                width: 440,
                height: 300,
                title: "Terminal 1",
                sessionId: "seed-w1",
              },
            },
            {
              id: "w2",
              type: "window",
              position: { x: 540, y: 40 },
              width: 440,
              height: 300,
              data: {
                id: "w2",
                kind: "terminal",
                x: 540,
                y: 40,
                width: 440,
                height: 300,
                title: "Terminal 2",
                sessionId: "seed-w2",
              },
            },
            {
              id: "w3",
              type: "window",
              position: { x: 60, y: 380 },
              width: 440,
              height: 320,
              data: {
                id: "w3",
                kind: "terminal",
                x: 60,
                y: 380,
                width: 440,
                height: 320,
                title: "Terminal 3",
                sessionId: "seed-w3",
              },
            },
            {
              id: "w4",
              type: "window",
              position: { x: 540, y: 380 },
              width: 580,
              height: 320,
              data: {
                id: "w4",
                kind: "iframe",
                x: 540,
                y: 380,
                width: 580,
                height: 320,
                title: "Browser",
                url: "https://example.com",
              },
            },
          ],
        },
        { id: "canvas-2", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
      ],
      uiMode: "horizontal-tabs",
      visible: true,
    },
    1: {
      canvases: [
        { id: "alpha", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
        { id: "beta", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
      ],
      uiMode: "horizontal-tabs",
      visible: true,
    },
    2: {
      canvases: [
        { id: "ui", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
        { id: "api", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
      ],
      uiMode: "horizontal-tabs",
      visible: true,
    },
    3: {
      canvases: [
        { id: "main", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
        { id: "docs", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [sessionOptsMap, setSessionOptsMap] = useState<
    Map<string, { shell?: string; cwd?: string; env?: Record<string, string> }>
  >(new Map());

  useEffect(() => {
    if (!readOnboarded()) {
      setWelcomeOpen(true);
    }
  }, []);

  const handleDismissWelcome = useCallback(() => {
    try {
      localStorage.setItem("ghovas.onboarded", "true");
    } catch {
      // localStorage unavailable; proceed silently
    }
    setWelcomeOpen(false);
    if (!readTutorialSeen()) {
      setTutorialOpen(true);
    }
  }, []);
  useWorkspacePersistence(workspace, setWorkspace);

  const cycleCanvas = useCallback(
    (level: LayerLevel) => {
      const layer = workspace.layers[level];
      if (!layer.visible) return;
      const canvases = layer.canvases;
      const currentIdx = canvases.findIndex((c) => c.id === activeIds[level]);
      const nextIdx = (currentIdx + 1) % canvases.length;
      const nextCanvasId = canvases[nextIdx]!.id;
      setActiveIds((prev) => ({ ...prev, [level]: nextCanvasId }));
    },
    [workspace.layers, activeIds],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const def of SHORTCUTS) {
        if (!matchesShortcut(e, def)) continue;
        if (def.id === "toggle-command-palette") {
          e.preventDefault();
          setPaletteOpen((open) => !open);
        } else if (def.id === "open-settings") {
          e.preventDefault();
          setSettingsOpen(true);
        } else if (def.id === "cycle-l0-canvas") {
          if (!workspace.layers[0].visible) break;
          e.preventDefault();
          cycleCanvas(0);
        } else if (
          def.id === "cycle-l1-canvas" ||
          def.id === "cycle-l2-canvas" ||
          def.id === "cycle-l3-canvas"
        ) {
          const level = def.id === "cycle-l1-canvas" ? 1 : def.id === "cycle-l2-canvas" ? 2 : 3;
          if (!workspace.layers[level as LayerLevel].visible) break;
          e.preventDefault();
          cycleCanvas(level as LayerLevel);
        } else if (def.id === "close-focused-window") {
          if (focusedWindowId == null) break;
          const windowId = focusedWindowId;
          e.preventDefault();
          setWorkspace((prev) => ({
            ...prev,
            layers: {
              ...prev.layers,
              0: {
                ...prev.layers[0],
                canvases: prev.layers[0].canvases.map((c) =>
                  c.id === activeIds[0]
                    ? { ...c, nodes: c.nodes.filter((n) => n.id !== windowId) }
                    : c,
                ),
              },
            },
          }));
          setFocusedWindowId(null);
        } else if (def.id === "cycle-next-window" || def.id === "cycle-prev-window") {
          const canvas = workspace.layers[0].canvases.find((c) => c.id === activeIds[0]);
          if (!canvas || canvas.nodes.length === 0) break;
          const nodes = canvas.nodes;
          const currentIdx = nodes.findIndex((n) => n.id === focusedWindowId);
          const delta = def.id === "cycle-next-window" ? 1 : -1;
          const nextIdx =
            currentIdx === -1 ? 0 : (currentIdx + delta + nodes.length) % nodes.length;
          e.preventDefault();
          setFocusedWindowId(nodes[nextIdx]!.id);
        }
        break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [workspace.layers, activeIds, focusedWindowId, cycleCanvas]);

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

  const handleCanvasChange = useCallback((next: CanvasStateV2) => {
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
            nodes: c.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, url } } : n)),
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

  const handleRenameCanvas = useCallback((level: LayerLevel, canvasId: string, name: string) => {
    setWorkspace((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        [level]: {
          ...prev.layers[level],
          canvases: prev.layers[level].canvases.map((c) =>
            c.id === canvasId ? { ...c, name } : c,
          ),
        },
      },
    }));
  }, []);

  const handleDuplicateCanvas = useCallback((level: LayerLevel, canvasId: string) => {
    setWorkspace((prev) => {
      const layer = prev.layers[level];
      const idx = layer.canvases.findIndex((c) => c.id === canvasId);
      if (idx === -1) return prev;
      const orig = layer.canvases[idx];
      const clone: CanvasStateV2 = {
        ...orig,
        id: crypto.randomUUID(),
        name: (orig.name ?? orig.id) + " copy",
        nodes: orig.nodes.map((n) => {
          const newId = crypto.randomUUID();
          return {
            ...n,
            id: newId,
            data: {
              ...n.data,
              id: newId,
              ...(n.data.kind === "terminal" ? { sessionId: crypto.randomUUID() } : {}),
            },
          };
        }),
      };
      const next = [...layer.canvases];
      next.splice(idx + 1, 0, clone);
      return {
        ...prev,
        layers: {
          ...prev.layers,
          [level]: { ...layer, canvases: next },
        },
      };
    });
  }, []);

  const handleNewCanvas = useCallback((level: LayerLevel) => {
    const newId = crypto.randomUUID().slice(0, 8);
    setWorkspace((prev) => {
      const newCanvas = {
        id: newId,
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [],
      };
      return {
        ...prev,
        layers: {
          ...prev.layers,
          [level]: {
            ...prev.layers[level],
            canvases: [...prev.layers[level].canvases, newCanvas],
          },
        },
      };
    });
    setActiveIds((prev) => ({ ...prev, [level]: newId }));
  }, []);

  const handleDeleteCanvas = useCallback(
    (level: LayerLevel, canvasId: string) => {
      setWorkspace((prev) => {
        const layer = prev.layers[level];
        if (layer.canvases.length <= 1) return prev;
        const next = layer.canvases.filter((c) => c.id !== canvasId);
        return {
          ...prev,
          layers: {
            ...prev.layers,
            [level]: { ...layer, canvases: next },
          },
        };
      });
      setActiveIds((prev) => {
        const layer = workspace.layers[level];
        if (prev[level] !== canvasId) return prev;
        const sibling = layer.canvases.find((c) => c.id !== canvasId);
        return sibling ? { ...prev, [level]: sibling.id } : prev;
      });
    },
    [workspace.layers],
  );

  const activeCanvas =
    workspace.layers[0].canvases.find((c) => c.id === activeIds[0]) ??
    workspace.layers[0].canvases[0]!;

  const resetViewport = useCallback(() => {
    handleCanvasChange({ ...activeCanvas, viewport: { x: 0, y: 0, zoom: 1 } });
  }, [activeCanvas, handleCanvasChange]);

  const focusedWindowTitle =
    focusedWindowId != null
      ? (activeCanvas.nodes.find((n) => n.id === focusedWindowId)?.data.title ?? null)
      : null;

  const focusedNode =
    focusedWindowId != null
      ? (activeCanvas.nodes.find((n) => n.id === focusedWindowId) ?? null)
      : null;

  const handleFocusWindow = useCallback((id: string) => {
    setFocusedWindowId(id);
  }, []);

  const handleAddWindow = useCallback(
    (node: WorkspaceNode) => {
      const targetId = activeCanvas.id;
      setWorkspace((prev) => ({
        ...prev,
        layers: {
          ...prev.layers,
          0: {
            ...prev.layers[0],
            canvases: prev.layers[0].canvases.map((c) =>
              c.id === targetId ? { ...c, nodes: [...c.nodes, node] } : c,
            ),
          },
        },
      }));
    },
    [activeCanvas.id],
  );

  const handleCreateTerminalWindow = useCallback(
    (
      sessionId: string,
      opts: { shell?: string; cwd?: string; env?: Record<string, string> },
    ) => {
      setSessionOptsMap((prev) => new Map(prev).set(sessionId, opts));
      const id = crypto.randomUUID();
      handleAddWindow({
        id,
        type: "window",
        position: { x: 100, y: 100 },
        width: 560,
        height: 360,
        data: {
          id,
          kind: "terminal",
          sessionId,
          title: "Terminal",
          x: 100,
          y: 100,
          width: 560,
          height: 360,
        },
      });
      handleFocusWindow(id);
    },
    [handleAddWindow, handleFocusWindow],
  );

  const terminalSessionCtxValue = useMemo<TerminalSessionCtxValue>(
    () => ({ createTerminalWindow: handleCreateTerminalWindow, sessionOptsMap }),
    [handleCreateTerminalWindow, sessionOptsMap],
  );

  const commands: Command[] = [
    {
      id: "reset-workspace",
      label: "Reset workspace to default",
      category: "Workspace",
      confirm: "This resets all layers and windows to the default workspace. Continue?",
      run: () => {
        setWorkspace(INITIAL_WORKSPACE);
        setActiveIds(INITIAL_ACTIVE);
      },
    },
    {
      id: "open-settings",
      label: "Open Settings",
      category: "Settings",
      run: () => setSettingsOpen(true),
    },
    {
      id: "new-iframe-window",
      label: "New iframe window",
      category: "Window",
      run: () => {
        const id = crypto.randomUUID();
        handleAddWindow({
          id,
          type: "window",
          position: { x: 100, y: 100 },
          width: 480,
          height: 320,
          data: {
            id,
            kind: "iframe",
            x: 100,
            y: 100,
            width: 480,
            height: 320,
            title: "Browser",
            url: "about:blank",
          },
        });
      },
    },
    {
      id: "show-tutorial",
      label: "Show tutorial",
      category: "Settings",
      run: () => setTutorialOpen(true),
    },
    {
      id: "new-terminal-window",
      label: "New terminal window",
      category: "Window",
      run: () => {
        const id = crypto.randomUUID();
        handleAddWindow({
          id,
          type: "window",
          position: { x: 100, y: 100 },
          width: 560,
          height: 360,
          data: {
            id,
            kind: "terminal",
            x: 100,
            y: 100,
            width: 560,
            height: 360,
            title: "Terminal",
            sessionId: crypto.randomUUID(),
          },
        });
      },
    },
    ...[1, 2, 3].flatMap((level) =>
      workspace.layers[level as LayerLevel].canvases.map((canvas) => ({
        id: `switch-l${level}-${canvas.id}`,
        label: `Switch L${level} → ${canvas.id}`,
        category: "Layer",
        run: () => handleActiveChange(level as LayerLevel, canvas.id),
      })),
    ),
    ...(focusedNode != null
      ? workspace.layers[0].canvases
          .filter((c) => c.id !== activeCanvas.id)
          .map((canvas) => ({
            id: `move-window-to-${canvas.id}`,
            label: `Move window to ${canvas.name ?? canvas.id}`,
            category: "Window",
            run: () => {
              const nid = focusedNode.id;
              const srcId = activeCanvas.id;
              setWorkspace((prev) => ({
                ...prev,
                layers: {
                  ...prev.layers,
                  0: {
                    ...prev.layers[0],
                    canvases: prev.layers[0].canvases.map((c) => {
                      if (c.id === srcId)
                        return { ...c, nodes: c.nodes.filter((n) => n.id !== nid) };
                      if (c.id === canvas.id) return { ...c, nodes: [...c.nodes, focusedNode] };
                      return c;
                    }),
                  },
                },
              }));
              setFocusedWindowId(null);
            },
          }))
      : []),
  ];

  return (
    <TerminalSessionCtx.Provider value={terminalSessionCtxValue}>
    <div className="grid h-screen w-screen [grid-template-rows:auto_1fr_auto] [grid-template-columns:auto_1fr] [grid-template-areas:'top_top'_'left_center'_'bottom_bottom']">
      <LayerBar
        workspace={workspace}
        activeIds={activeIds}
        onActiveChange={handleActiveChange}
        onUiModeChange={handleUiModeChange}
        onVisibilityChange={handleVisibilityChange}
        onRenameCanvas={handleRenameCanvas}
        onDuplicateCanvas={handleDuplicateCanvas}
        onDeleteCanvas={handleDeleteCanvas}
        onNewCanvas={handleNewCanvas}
      />
      <div className="[grid-area:center] relative overflow-hidden">
        <Canvas
          canvasState={activeCanvas}
          onCanvasChange={handleCanvasChange}
          onUrlChange={handleUrlChange}
          onAddWindow={handleAddWindow}
          focusedWindowId={focusedWindowId}
          onFocusWindow={handleFocusWindow}
        />
      </div>
      <StatusBar
        activeIds={activeIds}
        activeCanvasWindowCount={activeCanvas.nodes.length}
        zoom={workspace.layers[0].canvases.find((c) => c.id === activeIds[0])?.viewport.zoom ?? 1}
        focusedWindowTitle={focusedWindowTitle}
        onCycleLayer={cycleCanvas}
        onResetZoom={resetViewport}
      />
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
      {welcomeOpen && <Welcome onDismiss={handleDismissWelcome} />}
      {tutorialOpen && <TutorialOverlay onDone={() => setTutorialOpen(false)} />}
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        workspace={workspace}
        onUiModeChange={handleUiModeChange}
        onVisibilityChange={handleVisibilityChange}
        onWorkspaceReplace={setWorkspace}
      />
    </div>
    </TerminalSessionCtx.Provider>
  );
}
