import { useRef, useCallback, useEffect } from "react";
import type { CanvasState, WindowState } from "../shared/types";
import { Window } from "./Window";
import { CreateWindowFab } from "./CreateWindowFab";
import { Minimap } from "./Minimap";
import { clampZoom, zoomAtPoint, centeredWindowPosition } from "./lib/canvasGeometry";

const GRID_SIZE = 40;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_PRESETS = [0.25, 0.5, 1, 2] as const;

function Grid({ panX, panY, zoom }: { panX: number; panY: number; zoom: number }) {
  const scaledGrid = GRID_SIZE * zoom;
  const offsetX = ((panX % scaledGrid) + scaledGrid) % scaledGrid;
  const offsetY = ((panY % scaledGrid) + scaledGrid) % scaledGrid;

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <defs>
        <pattern
          id="grid"
          width={scaledGrid}
          height={scaledGrid}
          x={offsetX}
          y={offsetY}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${scaledGrid} 0 L 0 0 0 ${scaledGrid}`}
            fill="none"
            stroke="rgba(128,128,128,0.3)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

interface CanvasProps {
  canvasState: CanvasState;
  onCanvasChange: (next: CanvasState) => void;
  onUrlChange: (id: string, url: string) => void;
  onAddWindow: (win: WindowState) => void;
  focusedWindowId: string | null;
  onFocusWindow: (id: string) => void;
}

export function Canvas({ canvasState, onCanvasChange, onUrlChange, onAddWindow, focusedWindowId, onFocusWindow }: CanvasProps) {
  const stateRef = useRef(canvasState);
  stateRef.current = canvasState;

  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      const prev = stateRef.current;
      onCanvasChange({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy });
    },
    [onCanvasChange],
  );

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleCreateIframeWindow = useCallback(
    (url: string) => {
      const container = containerRef.current;
      const containerW = container?.clientWidth ?? 800;
      const containerH = container?.clientHeight ?? 600;
      const width = 480;
      const height = 320;
      const { x, y } = centeredWindowPosition(containerW, containerH, stateRef.current, width, height);
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

  const handlePanTo = useCallback(
    (newPanX: number, newPanY: number) => {
      onCanvasChange({ ...stateRef.current, panX: newPanX, panY: newPanY });
    },
    [onCanvasChange],
  );

  const handleZoomPreset = useCallback(
    (preset: number) => {
      onCanvasChange({ ...stateRef.current, zoom: clampZoom(preset, MIN_ZOOM, MAX_ZOOM) });
    },
    [onCanvasChange],
  );

  const handleCreateTerminalWindow = useCallback(() => {
    const container = containerRef.current;
    const containerW = container?.clientWidth ?? 800;
    const containerH = container?.clientHeight ?? 600;
    const width = 560;
    const height = 360;
    const { x, y } = centeredWindowPosition(containerW, containerH, stateRef.current, width, height);
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

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const prev = stateRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const next = zoomAtPoint(prev, cursorX, cursorY, factor, MIN_ZOOM, MAX_ZOOM);
      onCanvasChange({ ...prev, ...next });
    },
    [onCanvasChange],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const zoomPct = Math.round(canvasState.zoom * 100);
  const viewX = Math.round(-canvasState.panX / canvasState.zoom);
  const viewY = Math.round(-canvasState.panY / canvasState.zoom);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        cursor: dragging.current ? "grabbing" : "grab",
        background: "#1a1a1a",
        userSelect: "none",
      }}
    >
      <Grid panX={canvasState.panX} panY={canvasState.panY} zoom={canvasState.zoom} />
      {canvasState.windows.map((win) => (
        <Window
          key={win.id}
          win={win}
          panX={canvasState.panX}
          panY={canvasState.panY}
          zoom={canvasState.zoom}
          isFocused={focusedWindowId === win.id}
          onFocus={onFocusWindow}
          onClose={handleWindowClose}
          onMove={handleWindowMove}
          onResize={handleWindowResize}
          onUrlChange={onUrlChange}
          onRename={handleWindowRename}
          onDuplicate={handleWindowDuplicate}
        />
      ))}
      <CreateWindowFab onCreateIframeWindow={handleCreateIframeWindow} onCreateTerminalWindow={handleCreateTerminalWindow} />
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          display: "flex",
          background: "rgba(0,0,0,0.6)",
          borderRadius: 4,
          overflow: "hidden",
          zIndex: 5,
        }}
      >
        {ZOOM_PRESETS.map((preset) => {
          const pct = Math.round(preset * 100);
          const isActive = zoomPct === pct;
          return (
            <button
              key={pct}
              onClick={() => handleZoomPreset(preset)}
              style={{
                background: isActive ? "rgba(74,158,255,0.35)" : "transparent",
                color: isActive ? "#fff" : "#ccc",
                border: "none",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "monospace",
                fontSize: 12,
                padding: "4px 8px",
                cursor: "pointer",
                lineHeight: 1.6,
              }}
            >
              {pct}%
            </button>
          );
        })}
      </div>
      <Minimap
        windows={canvasState.windows}
        panX={canvasState.panX}
        panY={canvasState.panY}
        zoom={canvasState.zoom}
        containerWidth={containerRef.current?.clientWidth ?? 0}
        containerHeight={containerRef.current?.clientHeight ?? 0}
        onPanTo={handlePanTo}
      />
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          background: "rgba(0,0,0,0.6)",
          color: "#ccc",
          fontFamily: "monospace",
          fontSize: 12,
          padding: "4px 8px",
          borderRadius: 4,
          pointerEvents: "none",
          lineHeight: 1.6,
        }}
      >
        <div>{zoomPct}%</div>
        <div>
          {viewX}, {viewY}
        </div>
      </div>
    </div>
  );
}
