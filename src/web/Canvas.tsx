import { useRef, useCallback, useMemo, useEffect } from "react";
import type { RefObject } from "react";
import { Plus } from "lucide-react";
import { ReactFlow, Background, Controls, MiniMap, useReactFlow } from "@xyflow/react";
import type { NodeChange, NodeProps, Viewport } from "@xyflow/react";
import type { L0Canvas, WindowState, WorkspaceNode } from "../shared/types";
import { Window } from "./Window";
import type { WindowCallbacks } from "./Window";
import { CreateWindowFab } from "./CreateWindowFab";

function ZoomController({
  setZoomRef,
  containerRef,
}: {
  setZoomRef: RefObject<((zoom: number) => void) | null>;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const { setViewport, getViewport } = useReactFlow();
  const zoomFn = useCallback(
    (newZoom: number) => {
      const cw = containerRef.current?.clientWidth ?? 800;
      const ch = containerRef.current?.clientHeight ?? 600;
      const cx = cw / 2;
      const cy = ch / 2;
      const { x, y, zoom } = getViewport();
      const newX = cx + (x - cx) * (newZoom / zoom);
      const newY = cy + (y - cy) * (newZoom / zoom);
      setViewport({ x: newX, y: newY, zoom: newZoom }, { duration: 200 });
    },
    [setViewport, getViewport, containerRef],
  );
  setZoomRef.current = zoomFn;
  return null;
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
      win={win}
      isFocused={isFocused}
      onFocus={callbacks.onFocus}
      onClose={callbacks.onClose}
      onUrlChange={callbacks.onUrlChange}
      onRename={callbacks.onRename}
      onDuplicate={callbacks.onDuplicate}
    />
  );
}

const nodeTypes = { window: WindowNode };

function MinimapKeyboardController() {
  const { fitView, setViewport, getViewport } = useReactFlow();

  useEffect(() => {
    const minimap = document.querySelector<HTMLDivElement>(".react-flow__minimap");
    if (!minimap) return;

    minimap.setAttribute("tabindex", "0");
    minimap.setAttribute("role", "button");
    minimap.setAttribute(
      "aria-label",
      "Canvas overview minimap. Press Enter to fit view, arrow keys to pan.",
    );

    const PAN_STEP = 100;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        void fitView({ duration: 300 });
        return;
      }
      if (e.key === "Escape") {
        minimap.blur();
        document.querySelector<HTMLElement>(".react-flow__pane")?.focus();
        return;
      }
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = PAN_STEP;
      else if (e.key === "ArrowRight") dx = -PAN_STEP;
      else if (e.key === "ArrowUp") dy = PAN_STEP;
      else if (e.key === "ArrowDown") dy = -PAN_STEP;
      else return;
      e.preventDefault();
      const { x, y, zoom } = getViewport();
      void setViewport({ x: x + dx, y: y + dy, zoom }, { duration: 100 });
    };

    minimap.addEventListener("keydown", onKeyDown);
    return () => minimap.removeEventListener("keydown", onKeyDown);
  }, [fitView, setViewport, getViewport]);

  return null;
}

interface CanvasProps {
  canvasState: L0Canvas;
  onCanvasChange: (next: L0Canvas) => void;
  onUrlChange: (id: string, url: string) => void;
  onAddWindow: (node: WorkspaceNode) => void;
  focusedWindowId: string | null;
  onFocusWindow: (id: string) => void;
  setZoomRef?: RefObject<((zoom: number) => void) | null>;
}

export function Canvas({
  canvasState,
  onCanvasChange,
  onUrlChange,
  onAddWindow,
  focusedWindowId,
  onFocusWindow,
  setZoomRef,
}: CanvasProps) {
  const stateRef = useRef(canvasState);
  stateRef.current = canvasState;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWindowClose = useCallback(
    (id: string) => {
      const prev = stateRef.current;
      onCanvasChange({ ...prev, nodes: prev.nodes.filter((n) => n.id !== id) });
    },
    [onCanvasChange],
  );

  const handleWindowRename = useCallback(
    (id: string, title: string) => {
      const prev = stateRef.current;
      onCanvasChange({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, title } } : n)),
      });
    },
    [onCanvasChange],
  );

  const handleWindowDuplicate = useCallback(
    (id: string) => {
      const prev = stateRef.current;
      const src = prev.nodes.find((n) => n.id === id);
      if (!src) return;
      const newId = crypto.randomUUID();
      const newX = src.position.x + 30;
      const newY = src.position.y + 30;
      const copy: WorkspaceNode =
        src.data.kind === "terminal"
          ? {
              ...src,
              id: newId,
              position: { x: newX, y: newY },
              data: {
                ...src.data,
                id: newId,
                x: newX,
                y: newY,
                sessionId: crypto.randomUUID(),
                title: `${src.data.title} (copy)`,
              },
            }
          : {
              ...src,
              id: newId,
              position: { x: newX, y: newY },
              data: {
                ...src.data,
                id: newId,
                x: newX,
                y: newY,
                title: `${src.data.title} (copy)`,
              },
            };
      onCanvasChange({ ...prev, nodes: [...prev.nodes, copy] });
      onFocusWindow(copy.id);
    },
    [onCanvasChange, onFocusWindow],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const prev = stateRef.current;
      let nodes = prev.nodes;
      let changed = false;

      for (const change of changes) {
        if (change.type === "position" && change.position) {
          if (change.dragging === true) continue;
          const { x, y } = change.position;
          const node = nodes.find((n) => n.id === change.id);
          if (node && node.position.x === x && node.position.y === y) continue;
          nodes = nodes.map((n) =>
            n.id === change.id ? { ...n, position: { x, y }, data: { ...n.data, x, y } } : n,
          );
          changed = true;
        } else if (change.type === "dimensions" && change.dimensions) {
          if (change.resizing === true) continue;
          const { width, height } = change.dimensions;
          const node = nodes.find((n) => n.id === change.id);
          if (node && node.width === width && node.height === height) continue;
          nodes = nodes.map((n) =>
            n.id === change.id ? { ...n, width, height, data: { ...n.data, width, height } } : n,
          );
          changed = true;
        }
      }

      if (changed) {
        onCanvasChange({ ...prev, nodes });
      }
    },
    [onCanvasChange],
  );

  const handleViewportChange = useCallback(
    (viewport: Viewport) => {
      const prev = stateRef.current.viewport;
      if (prev.x === viewport.x && prev.y === viewport.y && prev.zoom === viewport.zoom) return;
      onCanvasChange({
        ...stateRef.current,
        viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
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
      const { viewport } = stateRef.current;
      const x = (containerW / 2 - viewport.x) / viewport.zoom - width / 2;
      const y = (containerH / 2 - viewport.y) / viewport.zoom - height / 2;
      let title = "Browser";
      try {
        title = new URL(url).host;
      } catch {}
      const id = crypto.randomUUID();
      const node: WorkspaceNode = {
        id,
        type: "window",
        position: { x, y },
        width,
        height,
        data: { id, kind: "iframe", url, title, x, y, width, height },
      };
      onAddWindow(node);
      onFocusWindow(id);
    },
    [onAddWindow, onFocusWindow],
  );

  const handleCreateTerminalWindow = useCallback(
    (sessionId?: string) => {
      const containerW = containerRef.current?.clientWidth ?? 800;
      const containerH = containerRef.current?.clientHeight ?? 600;
      const width = 560;
      const height = 360;
      const { viewport } = stateRef.current;
      const x = (containerW / 2 - viewport.x) / viewport.zoom - width / 2;
      const y = (containerH / 2 - viewport.y) / viewport.zoom - height / 2;
      const id = crypto.randomUUID();
      const node: WorkspaceNode = {
        id,
        type: "window",
        position: { x, y },
        width,
        height,
        data: {
          id,
          kind: "terminal",
          sessionId: sessionId ?? crypto.randomUUID().slice(0, 8),
          title: "Terminal",
          x,
          y,
          width,
          height,
        },
      };
      onAddWindow(node);
      onFocusWindow(id);
    },
    [onAddWindow, onFocusWindow],
  );

  const windowTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of canvasState.nodes) {
      if (node.data.kind === "terminal" && node.data.sessionId != null) {
        map.set(node.data.sessionId, node.data.title);
      }
    }
    return map;
  }, [canvasState.nodes]);

  const callbacks = useMemo(
    () => ({
      onFocus: onFocusWindow,
      onClose: handleWindowClose,
      onUrlChange,
      onRename: handleWindowRename,
      onDuplicate: handleWindowDuplicate,
    }),
    [onFocusWindow, handleWindowClose, onUrlChange, handleWindowRename, handleWindowDuplicate],
  );

  const nodes = useMemo(
    () =>
      canvasState.nodes.map((node) => ({
        id: node.id,
        type: "window" as const,
        position: node.position,
        width: node.width,
        height: node.height,
        zIndex: focusedWindowId === node.id ? 100 : 1,
        ariaLabel:
          node.data.kind === "terminal"
            ? `Terminal: ${node.data.sessionId ?? "new session"}`
            : `iframe: ${node.data.url ?? "(no url)"}`,
        data: {
          win: node.data,
          isFocused: focusedWindowId === node.id,
          callbacks,
        },
        dragHandle: ".drag-handle",
      })),
    [canvasState.nodes, focusedWindowId, callbacks],
  );

  return (
    <div
      data-tutorial="canvas"
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-dark-canvas"
    >
      <ReactFlow
        aria-label="Window manager canvas"
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={[]}
        onNodesChange={handleNodesChange}
        onViewportChange={handleViewportChange}
        defaultViewport={{
          x: canvasState.viewport.x,
          y: canvasState.viewport.y,
          zoom: canvasState.viewport.zoom,
        }}
        minZoom={0.25}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        {setZoomRef && <ZoomController setZoomRef={setZoomRef} containerRef={containerRef} />}
        <MinimapKeyboardController />
        <MiniMap
          aria-label="Canvas overview minimap"
          style={{
            width: 156,
            height: 96,
            bottom: 36,
            right: 16,
          }}
          nodeColor={(node) =>
            node.id === focusedWindowId ? "var(--color-primary)" : "var(--color-on-dark-soft)"
          }
          nodeStrokeWidth={0}
          nodeBorderRadius={1}
          maskColor="color-mix(in srgb, var(--color-surface-dark) 70%, transparent)"
          maskStrokeColor="var(--color-primary)"
          maskStrokeWidth={1.5}
          className="!bg-surface-dark/85 backdrop-blur-md border border-dark-hairline rounded-md"
        />
        {canvasState.nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-on-dark-muted font-mono text-[13px] pointer-events-none z-[5]">
            <Plus size={32} aria-hidden />
            <div className="font-medium text-on-dark-strong">No windows yet</div>
            <div className="max-w-[280px] text-center text-on-dark-muted text-[12px] leading-relaxed">
              Click the <span className="text-primary">+</span> button (right bottom) to add a
              terminal or browser window,
              <br />
              or press{" "}
              <kbd className="bg-surface-dark-elevated border border-dark-hairline px-1 rounded text-[11px]">
                Mod+K
              </kbd>{" "}
              for the command palette.
            </div>
          </div>
        )}
      </ReactFlow>
      <CreateWindowFab
        onCreateIframeWindow={handleCreateIframeWindow}
        onCreateTerminalWindow={handleCreateTerminalWindow}
        windowTitles={windowTitles}
      />
    </div>
  );
}
