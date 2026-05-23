import { useRef, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import type { NodeChange, NodeProps, Viewport } from "@xyflow/react";
import type { CanvasStateV2, WindowState, WorkspaceNode } from "../shared/types";
import { Window } from "./Window";
import type { WindowCallbacks } from "./Window";
import { CreateWindowFab } from "./CreateWindowFab";

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

interface CanvasProps {
  canvasState: CanvasStateV2;
  onCanvasChange: (next: CanvasStateV2) => void;
  onUrlChange: (id: string, url: string) => void;
  onAddWindow: (node: WorkspaceNode) => void;
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
        if (change.type === "position" && change.position && change.dragging === false) {
          const { x, y } = change.position;
          nodes = nodes.map((n) =>
            n.id === change.id ? { ...n, position: { x, y }, data: { ...n.data, x, y } } : n,
          );
          changed = true;
        } else if (change.type === "dimensions" && change.dimensions && change.resizing === false) {
          const { width, height } = change.dimensions;
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

  const handleCreateTerminalWindow = useCallback(() => {
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
        sessionId: crypto.randomUUID(),
        title: "Terminal",
        x,
        y,
        width,
        height,
      },
    };
    onAddWindow(node);
    onFocusWindow(id);
  }, [onAddWindow, onFocusWindow]);

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
        <MiniMap
          nodeColor={() => "var(--color-primary)"}
          maskColor="var(--color-surface-dark-elevated)"
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
      />
    </div>
  );
}
