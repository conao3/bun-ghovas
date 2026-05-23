import { useRef, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from "@xyflow/react";
import type { NodeChange, NodeProps, Viewport } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CanvasState, WindowState } from "../shared/types";
import { Window } from "./Window";
import { CreateWindowFab } from "./CreateWindowFab";

interface WindowCallbacks {
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, x: number, y: number, width: number, height: number) => void;
  onUrlChange: (id: string, url: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
}

interface WindowNodeData {
  win: WindowState;
  isFocused: boolean;
  callbacks: WindowCallbacks;
}

function WindowNode({ data }: NodeProps) {
  const { win, isFocused, callbacks } = data as unknown as WindowNodeData;
  return (
    <Window
      win={{ ...win, x: 0, y: 0 }}
      panX={0}
      panY={0}
      zoom={1}
      isFocused={isFocused}
      onFocus={callbacks.onFocus}
      onClose={callbacks.onClose}
      onMove={callbacks.onMove}
      onResize={callbacks.onResize}
      onUrlChange={callbacks.onUrlChange}
      onRename={callbacks.onRename}
      onDuplicate={callbacks.onDuplicate}
    />
  );
}

const nodeTypes = { window: WindowNode };

interface CanvasProps {
  canvasState: CanvasState;
  onCanvasChange: (next: CanvasState) => void;
  onUrlChange: (id: string, url: string) => void;
  onAddWindow: (win: WindowState) => void;
  focusedWindowId: string | null;
  onFocusWindow: (id: string) => void;
}

export function Canvas({
  canvasState,
  onCanvasChange,
  onUrlChange,
  onAddWindow,
  focusedWindowId,
  onFocusWindow,
}: CanvasProps) {
  const stateRef = useRef(canvasState);
  stateRef.current = canvasState;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWindowClose = useCallback(
    (id: string) => {
      const prev = stateRef.current;
      onCanvasChange({ ...prev, windows: prev.windows.filter((w) => w.id !== id) });
    },
    [onCanvasChange],
  );

  const handleWindowRename = useCallback(
    (id: string, title: string) => {
      const prev = stateRef.current;
      onCanvasChange({
        ...prev,
        windows: prev.windows.map((w) => (w.id === id ? { ...w, title } : w)),
      });
    },
    [onCanvasChange],
  );

  const handleWindowDuplicate = useCallback(
    (id: string) => {
      const prev = stateRef.current;
      const src = prev.windows.find((w) => w.id === id);
      if (!src) return;
      const copy =
        src.kind === "terminal"
          ? {
              id: crypto.randomUUID(),
              kind: "terminal" as const,
              sessionId: crypto.randomUUID(),
              title: `${src.title} (copy)`,
              x: src.x + 30,
              y: src.y + 30,
              width: src.width,
              height: src.height,
            }
          : {
              id: crypto.randomUUID(),
              kind: "iframe" as const,
              url: src.url,
              title: `${src.title} (copy)`,
              x: src.x + 30,
              y: src.y + 30,
              width: src.width,
              height: src.height,
            };
      onCanvasChange({ ...prev, windows: [...prev.windows, copy] });
      onFocusWindow(copy.id);
    },
    [onCanvasChange, onFocusWindow],
  );

  const handleWindowMove = useCallback(
    (id: string, x: number, y: number) => {
      const prev = stateRef.current;
      onCanvasChange({
        ...prev,
        windows: prev.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
      });
    },
    [onCanvasChange],
  );

  const handleWindowResize = useCallback(
    (id: string, x: number, y: number, width: number, height: number) => {
      const prev = stateRef.current;
      onCanvasChange({
        ...prev,
        windows: prev.windows.map((w) => (w.id === id ? { ...w, x, y, width, height } : w)),
      });
    },
    [onCanvasChange],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const prev = stateRef.current;
      let windows = prev.windows;
      let changed = false;

      for (const change of changes) {
        if (change.type === "position" && change.position) {
          const { x, y } = change.position;
          windows = windows.map((w) => (w.id === change.id ? { ...w, x, y } : w));
          changed = true;
        } else if (change.type === "dimensions" && change.dimensions) {
          const { width, height } = change.dimensions;
          windows = windows.map((w) => (w.id === change.id ? { ...w, width, height } : w));
          changed = true;
        }
      }

      if (changed) {
        onCanvasChange({ ...prev, windows });
      }
    },
    [onCanvasChange],
  );

  const handleViewportChange = useCallback(
    (viewport: Viewport) => {
      onCanvasChange({
        ...stateRef.current,
        panX: viewport.x,
        panY: viewport.y,
        zoom: viewport.zoom,
      });
    },
    [onCanvasChange],
  );

  const handleCreateIframeWindow = useCallback(
    (url: string) => {
      const containerW = containerRef.current?.clientWidth ?? 800;
      const containerH = containerRef.current?.clientHeight ?? 600;
      const width = 480;
      const height = 320;
      const { panX, panY, zoom } = stateRef.current;
      const x = (containerW / 2 - panX) / zoom - width / 2;
      const y = (containerH / 2 - panY) / zoom - height / 2;
      let title = "Browser";
      try {
        title = new URL(url).host;
      } catch {}
      const win: WindowState = {
        id: crypto.randomUUID(),
        kind: "iframe",
        url,
        title,
        x,
        y,
        width,
        height,
      };
      onAddWindow(win);
      onFocusWindow(win.id);
    },
    [onAddWindow, onFocusWindow],
  );

  const handleCreateTerminalWindow = useCallback(() => {
    const containerW = containerRef.current?.clientWidth ?? 800;
    const containerH = containerRef.current?.clientHeight ?? 600;
    const width = 560;
    const height = 360;
    const { panX, panY, zoom } = stateRef.current;
    const x = (containerW / 2 - panX) / zoom - width / 2;
    const y = (containerH / 2 - panY) / zoom - height / 2;
    const win: WindowState = {
      id: crypto.randomUUID(),
      kind: "terminal",
      sessionId: crypto.randomUUID(),
      title: "Terminal",
      x,
      y,
      width,
      height,
    };
    onAddWindow(win);
    onFocusWindow(win.id);
  }, [onAddWindow, onFocusWindow]);

  const callbacks = useMemo(
    () => ({
      onFocus: onFocusWindow,
      onClose: handleWindowClose,
      onMove: handleWindowMove,
      onResize: handleWindowResize,
      onUrlChange,
      onRename: handleWindowRename,
      onDuplicate: handleWindowDuplicate,
    }),
    [
      onFocusWindow,
      handleWindowClose,
      handleWindowMove,
      handleWindowResize,
      onUrlChange,
      handleWindowRename,
      handleWindowDuplicate,
    ],
  );

  const nodes = useMemo(
    () =>
      canvasState.windows.map((win) => ({
        id: win.id,
        type: "window" as const,
        position: { x: win.x, y: win.y },
        width: win.width,
        height: win.height,
        zIndex: focusedWindowId === win.id ? 100 : 1,
        data: {
          win,
          isFocused: focusedWindowId === win.id,
          callbacks,
        },
        dragHandle: ".drag-handle",
      })),
    [canvasState.windows, focusedWindowId, callbacks],
  );

  return (
    <div data-tutorial="canvas" ref={containerRef} className="absolute inset-0">
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={[]}
        onNodesChange={handleNodesChange}
        onViewportChange={handleViewportChange}
        defaultViewport={{ x: canvasState.panX, y: canvasState.panY, zoom: canvasState.zoom }}
        minZoom={0.25}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <CreateWindowFab
        onCreateIframeWindow={handleCreateIframeWindow}
        onCreateTerminalWindow={handleCreateTerminalWindow}
      />
    </div>
  );
}
