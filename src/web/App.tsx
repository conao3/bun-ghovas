import { useState, useCallback, useEffect } from "react";
import { Canvas } from "./Canvas";
import { LayerBar } from "./LayerBar";
import { StatusBar } from "./StatusBar";
import { CommandPalette } from "./CommandPalette";
import type { Command } from "./CommandPalette";
import type {
  WorkspaceState,
  LayerLevel,
  LayerUiMode,
  CanvasState,
  WindowState,
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

const INITIAL_WORKSPACE: WorkspaceState = {
  layers: {
    0: {
      canvases: [
        {
          id: "canvas-1",
          windows: [
            {
              id: "w1",
              kind: "terminal",
              x: 80,
              y: 60,
              width: 420,
              height: 300,
              title: "Terminal 1",
              sessionId: "seed-w1",
            },
            {
              id: "w2",
              kind: "terminal",
              x: 540,
              y: 100,
              width: 400,
              height: 280,
              title: "Terminal 2",
              sessionId: "seed-w2",
            },
            {
              id: "w3",
              kind: "iframe",
              x: 180,
              y: 420,
              width: 460,
              height: 320,
              title: "Browser",
              url: "https://example.com",
            },
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const def of SHORTCUTS) {
        if (matchesShortcut(e, def)) {
          e.preventDefault();
          if (def.id === "toggle-command-palette") setPaletteOpen((open) => !open);
          else if (def.id === "open-settings") setSettingsOpen(true);
          break;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
      const clone: CanvasState = {
        ...orig,
        id: crypto.randomUUID(),
        name: (orig.name ?? orig.id) + " copy",
        windows: orig.windows.map((w) => ({
          ...w,
          id: crypto.randomUUID(),
          ...(w.kind === "terminal" ? { sessionId: crypto.randomUUID() } : {}),
        })),
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

  const focusedWindowTitle =
    focusedWindowId != null
      ? (activeCanvas.windows.find((w) => w.id === focusedWindowId)?.title ?? null)
      : null;

  const focusedWindow =
    focusedWindowId != null
      ? (activeCanvas.windows.find((w) => w.id === focusedWindowId) ?? null)
      : null;

  const handleFocusWindow = useCallback((id: string) => {
    setFocusedWindowId(id);
  }, []);

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

  const commands: Command[] = [
    {
      id: "reset-workspace",
      label: "Reset workspace to default",
      confirm: "This resets all layers and windows to the default workspace. Continue?",
      run: () => {
        setWorkspace(INITIAL_WORKSPACE);
        setActiveIds(INITIAL_ACTIVE);
      },
    },
    {
      id: "open-settings",
      label: "Open Settings",
      run: () => setSettingsOpen(true),
    },
    {
      id: "new-iframe-window",
      label: "New iframe window",
      run: () =>
        handleAddWindow({
          id: crypto.randomUUID(),
          kind: "iframe",
          x: 100,
          y: 100,
          width: 480,
          height: 320,
          title: "Browser",
          url: "about:blank",
        }),
    },
    {
      id: "show-tutorial",
      label: "Show tutorial",
      run: () => setTutorialOpen(true),
    },
    {
      id: "new-terminal-window",
      label: "New terminal window",
      run: () =>
        handleAddWindow({
          id: crypto.randomUUID(),
          kind: "terminal",
          x: 100,
          y: 100,
          width: 560,
          height: 360,
          title: "Terminal",
          sessionId: crypto.randomUUID(),
        }),
    },
    ...[1, 2, 3].flatMap((level) =>
      workspace.layers[level as LayerLevel].canvases.map((canvas) => ({
        id: `switch-l${level}-${canvas.id}`,
        label: `Switch L${level} → ${canvas.id}`,
        run: () => handleActiveChange(level as LayerLevel, canvas.id),
      })),
    ),
    ...(focusedWindow != null
      ? workspace.layers[0].canvases
          .filter((c) => c.id !== activeCanvas.id)
          .map((canvas) => ({
            id: `move-window-to-${canvas.id}`,
            label: `Move window to ${canvas.name ?? canvas.id}`,
            run: () => {
              const wid = focusedWindow.id;
              const srcId = activeCanvas.id;
              setWorkspace((prev) => ({
                ...prev,
                layers: {
                  ...prev.layers,
                  0: {
                    ...prev.layers[0],
                    canvases: prev.layers[0].canvases.map((c) => {
                      if (c.id === srcId)
                        return { ...c, windows: c.windows.filter((w) => w.id !== wid) };
                      if (c.id === canvas.id)
                        return { ...c, windows: [...c.windows, focusedWindow] };
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
    <div
      className="grid h-screen [grid-template-rows:auto_1fr_auto] [grid-template-columns:auto_1fr] [grid-template-areas:'top_top'_'left_center'_'bottom_bottom']"
    >
      <LayerBar
        workspace={workspace}
        activeIds={activeIds}
        onActiveChange={handleActiveChange}
        onUiModeChange={handleUiModeChange}
        onVisibilityChange={handleVisibilityChange}
        onRenameCanvas={handleRenameCanvas}
        onDuplicateCanvas={handleDuplicateCanvas}
        onDeleteCanvas={handleDeleteCanvas}
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
        zoom={workspace.layers[0].canvases.find((c) => c.id === activeIds[0])?.zoom ?? 1}
        focusedWindowTitle={focusedWindowTitle}
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
  );
}
