import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
  L0Canvas,
  L1Canvas,
  L2Canvas,
  L3Canvas,
  WorkspaceNode,
} from "../shared/types";
import { useWorkspacePersistence } from "./lib/useWorkspacePersistence";
import {
  getActiveL0,
  getChildrenAt,
  computeLayers,
  appendCanvas,
  removeSubtree,
  duplicateSubtree,
} from "./lib/layerTree";
import { Settings } from "./Settings";
import { Welcome } from "./Welcome";
import { TutorialOverlay } from "./TutorialOverlay";
import { SHORTCUTS, matchesShortcut, getShortcutBinding } from "./lib/shortcuts";

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

const INITIAL_WORKSPACE_BASE = {
  l3: [{ id: "default-l3", name: "L3" }] satisfies L3Canvas[],
  l2: [{ id: "default-l2", name: "L2", parentL3: "default-l3" }] satisfies L2Canvas[],
  l1: [{ id: "default-l1", name: "L1", parentL2: "default-l2" }] satisfies L1Canvas[],
  l0: [
    {
      id: "canvas-1",
      parentL1: "default-l1",
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        {
          id: "w1",
          type: "window" as const,
          position: { x: 60, y: 40 },
          width: 440,
          height: 300,
          data: {
            id: "w1",
            kind: "terminal" as const,
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
          type: "window" as const,
          position: { x: 540, y: 40 },
          width: 440,
          height: 300,
          data: {
            id: "w2",
            kind: "terminal" as const,
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
          type: "window" as const,
          position: { x: 60, y: 380 },
          width: 440,
          height: 320,
          data: {
            id: "w3",
            kind: "terminal" as const,
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
          type: "window" as const,
          position: { x: 540, y: 380 },
          width: 580,
          height: 320,
          data: {
            id: "w4",
            kind: "iframe" as const,
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
    { id: "canvas-2", parentL1: "default-l1", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
  ] satisfies L0Canvas[],
  layerConfig: {
    0: { uiMode: "horizontal-tabs" as LayerUiMode, visible: true },
    1: { uiMode: "horizontal-tabs" as LayerUiMode, visible: true },
    2: { uiMode: "horizontal-tabs" as LayerUiMode, visible: true },
    3: { uiMode: "horizontal-tabs" as LayerUiMode, visible: true },
  },
};

export const INITIAL_WORKSPACE: WorkspaceState = {
  ...INITIAL_WORKSPACE_BASE,
  layers: computeLayers(INITIAL_WORKSPACE_BASE),
};

const INITIAL_ACTIVE: Record<LayerLevel, string> = {
  0: "canvas-1",
  1: "default-l1",
  2: "default-l2",
  3: "default-l3",
};

function applyLayers(
  ws: Omit<WorkspaceState, "layers"> &
    Pick<WorkspaceState, "l0" | "l1" | "l2" | "l3" | "layerConfig">,
): WorkspaceState {
  return { ...ws, layers: computeLayers(ws) };
}

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
  const { currentName: currentWorkspaceName, switchCurrent: switchWorkspace } = useWorkspacePersistence(workspace, setWorkspace);

  const cycleCanvas = useCallback(
    (level: LayerLevel) => {
      if (!workspace.layers[level].visible) return;
      const canvases = getChildrenAt(workspace, level, activeIds);
      const currentIdx = canvases.findIndex((c) => c.id === activeIds[level]);
      const nextIdx = (currentIdx + 1) % canvases.length;
      const nextCanvasId = canvases[nextIdx]!.id;
      setActiveIds((prev) => ({ ...prev, [level]: nextCanvasId }));
    },
    [workspace, activeIds],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const def of SHORTCUTS) {
        if (!matchesShortcut(e, getShortcutBinding(def.id))) continue;
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
          setWorkspace((prev) => {
            const newL0 = prev.l0.map((c) =>
              c.id === activeIds[0] ? { ...c, nodes: c.nodes.filter((n) => n.id !== windowId) } : c,
            );
            return applyLayers({ ...prev, l0: newL0 });
          });
          setFocusedWindowId(null);
        } else if (def.id === "cycle-next-window" || def.id === "cycle-prev-window") {
          const canvas = workspace.l0.find((c) => c.id === activeIds[0]);
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
  }, [workspace, activeIds, focusedWindowId, cycleCanvas]);

  const handleActiveChange = (level: LayerLevel, id: string) => {
    setActiveIds((prev) => {
      const next = { ...prev, [level]: id };
      if (level === 3) {
        const l2children = workspace.l2.filter((c) => c.parentL3 === id);
        next[2] = l2children[0]?.id ?? prev[2];
        const l1children = workspace.l1.filter((c) => c.parentL2 === next[2]);
        next[1] = l1children[0]?.id ?? prev[1];
        const l0children = workspace.l0.filter((c) => c.parentL1 === next[1]);
        next[0] = l0children[0]?.id ?? prev[0];
      } else if (level === 2) {
        const l1children = workspace.l1.filter((c) => c.parentL2 === id);
        next[1] = l1children[0]?.id ?? prev[1];
        const l0children = workspace.l0.filter((c) => c.parentL1 === next[1]);
        next[0] = l0children[0]?.id ?? prev[0];
      } else if (level === 1) {
        const l0children = workspace.l0.filter((c) => c.parentL1 === id);
        next[0] = l0children[0]?.id ?? prev[0];
      }
      return next;
    });
  };

  const handleCanvasChange = useCallback((next: L0Canvas) => {
    setWorkspace((prev) => {
      const newL0 = prev.l0.map((c) => (c.id === next.id ? next : c));
      return applyLayers({ ...prev, l0: newL0 });
    });
  }, []);

  const handleUrlChange = useCallback((id: string, url: string) => {
    setWorkspace((prev) => {
      const newL0 = prev.l0.map((c) => ({
        ...c,
        nodes: c.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, url } } : n)),
      }));
      return applyLayers({ ...prev, l0: newL0 });
    });
  }, []);

  const handleUiModeChange = useCallback((level: LayerLevel, mode: LayerUiMode) => {
    setWorkspace((prev) => {
      const ws = {
        ...prev,
        layerConfig: { ...prev.layerConfig, [level]: { ...prev.layerConfig[level], uiMode: mode } },
      };
      return applyLayers(ws);
    });
  }, []);

  const handleVisibilityChange = useCallback((level: LayerLevel, visible: boolean) => {
    setWorkspace((prev) => {
      const ws = {
        ...prev,
        layerConfig: { ...prev.layerConfig, [level]: { ...prev.layerConfig[level], visible } },
      };
      return applyLayers(ws);
    });
  }, []);

  const handleRenameCanvas = useCallback((level: LayerLevel, canvasId: string, name: string) => {
    setWorkspace((prev) => {
      if (level === 0) {
        return applyLayers({
          ...prev,
          l0: prev.l0.map((c) => (c.id === canvasId ? { ...c, name } : c)),
        });
      } else if (level === 1) {
        return applyLayers({
          ...prev,
          l1: prev.l1.map((c) => (c.id === canvasId ? { ...c, name } : c)),
        });
      } else if (level === 2) {
        return applyLayers({
          ...prev,
          l2: prev.l2.map((c) => (c.id === canvasId ? { ...c, name } : c)),
        });
      } else {
        return applyLayers({
          ...prev,
          l3: prev.l3.map((c) => (c.id === canvasId ? { ...c, name } : c)),
        });
      }
    });
  }, []);

  const handleDuplicateCanvas = useCallback((level: LayerLevel, canvasId: string) => {
    const cloneNodes = (nodes: WorkspaceNode[]) =>
      nodes.map((n) => {
        const newNId = crypto.randomUUID();
        return {
          ...n,
          id: newNId,
          data: {
            ...n.data,
            id: newNId,
            ...(n.data.kind === "terminal" ? { sessionId: crypto.randomUUID() } : {}),
          },
        };
      });
    setWorkspace((prev) =>
      applyLayers({ ...prev, ...duplicateSubtree(prev, level, canvasId, cloneNodes) }),
    );
  }, []);

  const handleNewCanvas = useCallback(
    (level: LayerLevel) => {
      const newId = crypto.randomUUID().slice(0, 8);
      setWorkspace((prev) =>
        applyLayers({ ...prev, ...appendCanvas(prev, level, activeIds, newId) }),
      );
      setActiveIds((prev) => ({ ...prev, [level]: newId }));
    },
    [activeIds],
  );

  const handleDeleteCanvas = useCallback(
    (level: LayerLevel, canvasId: string) => {
      setWorkspace((prev) => applyLayers({ ...prev, ...removeSubtree(prev, level, canvasId) }));
      setActiveIds((prev) => {
        if (prev[level] !== canvasId) return prev;
        let siblingId: string | undefined;
        if (level === 0) {
          const target = workspace.l0.find((c) => c.id === canvasId);
          siblingId = workspace.l0.find(
            (c) => c.parentL1 === target?.parentL1 && c.id !== canvasId,
          )?.id;
        } else if (level === 1) {
          const target = workspace.l1.find((c) => c.id === canvasId);
          siblingId = workspace.l1.find(
            (c) => c.parentL2 === target?.parentL2 && c.id !== canvasId,
          )?.id;
        } else if (level === 2) {
          const target = workspace.l2.find((c) => c.id === canvasId);
          siblingId = workspace.l2.find(
            (c) => c.parentL3 === target?.parentL3 && c.id !== canvasId,
          )?.id;
        } else {
          siblingId = workspace.l3.find((c) => c.id !== canvasId)?.id;
        }
        if (!siblingId) return prev;
        const next = { ...prev, [level]: siblingId };
        if (level === 3) {
          const firstL2 = workspace.l2.find((c) => c.parentL3 === siblingId);
          if (firstL2) {
            next[2] = firstL2.id;
            const firstL1 = workspace.l1.find((c) => c.parentL2 === firstL2.id);
            if (firstL1) {
              next[1] = firstL1.id;
              const firstL0 = workspace.l0.find((c) => c.parentL1 === firstL1.id);
              if (firstL0) next[0] = firstL0.id;
            }
          }
        } else if (level === 2) {
          const firstL1 = workspace.l1.find((c) => c.parentL2 === siblingId);
          if (firstL1) {
            next[1] = firstL1.id;
            const firstL0 = workspace.l0.find((c) => c.parentL1 === firstL1.id);
            if (firstL0) next[0] = firstL0.id;
          }
        } else if (level === 1) {
          const firstL0 = workspace.l0.find((c) => c.parentL1 === siblingId);
          if (firstL0) next[0] = firstL0.id;
        }
        return next;
      });
    },
    [workspace],
  );

  const activeCanvas = getActiveL0(workspace, activeIds);

  const setZoomRef = useRef<((zoom: number) => void) | null>(null);

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
      setWorkspace((prev) => {
        const newL0 = prev.l0.map((c) =>
          c.id === targetId ? { ...c, nodes: [...c.nodes, node] } : c,
        );
        return applyLayers({ ...prev, l0: newL0 });
      });
    },
    [activeCanvas.id],
  );

  const handleCreateTerminalWindow = useCallback(
    (sessionId: string, opts: { shell?: string; cwd?: string; env?: Record<string, string> }) => {
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
    ...workspace.l3.map((canvas) => ({
      id: `switch-l3-${canvas.id}`,
      label: `Switch L3 → ${canvas.name ?? canvas.id}`,
      category: "Layer",
      run: () => handleActiveChange(3, canvas.id),
    })),
    ...workspace.l2.map((canvas) => {
      const parentL3 = workspace.l3.find((l) => l.id === canvas.parentL3);
      const l3Name = parentL3?.name ?? parentL3?.id ?? canvas.parentL3;
      return {
        id: `switch-l2-${canvas.id}`,
        label: `Switch L2 → ${canvas.name ?? canvas.id} (under ${l3Name})`,
        category: "Layer",
        run: () => handleActiveChange(2, canvas.id),
      };
    }),
    ...workspace.l1.map((canvas) => {
      const parentL2 = workspace.l2.find((l) => l.id === canvas.parentL2);
      const parentL3 = workspace.l3.find((l) => l.id === parentL2?.parentL3);
      const l3Name = parentL3?.name ?? parentL3?.id ?? "";
      const l2Name = parentL2?.name ?? parentL2?.id ?? canvas.parentL2;
      return {
        id: `switch-l1-${canvas.id}`,
        label: `Switch L1 → ${canvas.name ?? canvas.id} (under ${l3Name} › ${l2Name})`,
        category: "Layer",
        run: () => handleActiveChange(1, canvas.id),
      };
    }),
    ...(focusedNode != null
      ? workspace.l0
          .filter((c) => c.id !== activeCanvas.id)
          .map((canvas) => {
            const parentL1 = workspace.l1.find((l) => l.id === canvas.parentL1);
            const parentL2 = workspace.l2.find((l) => l.id === parentL1?.parentL2);
            const parentL3 = workspace.l3.find((l) => l.id === parentL2?.parentL3);
            const l3Name = parentL3?.name ?? parentL3?.id ?? "";
            const l2Name = parentL2?.name ?? parentL2?.id ?? "";
            const l1Name = parentL1?.name ?? parentL1?.id ?? canvas.parentL1;
            return {
              id: `move-window-to-${canvas.id}`,
              label: `Move window to ${canvas.name ?? canvas.id} (under ${l3Name} › ${l2Name} › ${l1Name})`,
              category: "Window",
              run: () => {
                const nid = focusedNode.id;
                const srcId = activeCanvas.id;
                setWorkspace((prev) => {
                  const newL0 = prev.l0.map((c) => {
                    if (c.id === srcId) return { ...c, nodes: c.nodes.filter((n) => n.id !== nid) };
                    if (c.id === canvas.id) return { ...c, nodes: [...c.nodes, focusedNode] };
                    return c;
                  });
                  return applyLayers({ ...prev, l0: newL0 });
                });
                setFocusedWindowId(null);
              },
            };
          })
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
            setZoomRef={setZoomRef}
          />
        </div>
        <StatusBar
          workspace={workspace}
          activeIds={activeIds}
          activeCanvasWindowCount={activeCanvas.nodes.length}
          zoom={activeCanvas.viewport.zoom}
          focusedWindowTitle={focusedWindowTitle}
          onCycleLayer={cycleCanvas}
          onSetZoom={(z) => { setZoomRef.current?.(z); }}
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
          activeIds={activeIds}
          onUiModeChange={handleUiModeChange}
          onVisibilityChange={handleVisibilityChange}
          onWorkspaceReplace={setWorkspace}
          currentWorkspaceName={currentWorkspaceName}
          onWorkspaceCurrentChange={switchWorkspace}
        />
      </div>
    </TerminalSessionCtx.Provider>
  );
}
