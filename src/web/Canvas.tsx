import { useState, useRef, useCallback, useEffect } from "react";
import type { CanvasState, WindowState } from "../shared/types";
import { Window } from "./Window";
import { CreateWindowFab } from "./CreateWindowFab";

const GRID_SIZE = 40;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

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
}

export function Canvas({ canvasState, onCanvasChange, onUrlChange, onAddWindow }: CanvasProps) {
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);

  const stateRef = useRef(canvasState);
  stateRef.current = canvasState;

  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWindowFocus = useCallback((id: string) => {
    setFocusedWindowId(id);
  }, []);

  const handleWindowClose = useCallback(
    (id: string) => {
      const prev = stateRef.current;
      onCanvasChange({ ...prev, windows: prev.windows.filter((w) => w.id !== id) });
      setFocusedWindowId((f) => (f === id ? null : f));
    },
    [onCanvasChange],
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
      const { panX, panY, zoom } = stateRef.current;
      const width = 480;
      const height = 320;
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
      setFocusedWindowId(win.id);
    },
    [onAddWindow],
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const prev = stateRef.current;
      const delta = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * delta));
      const scale = newZoom / prev.zoom;
      const newPanX = cursorX - scale * (cursorX - prev.panX);
      const newPanY = cursorY - scale * (cursorY - prev.panY);
      onCanvasChange({ ...prev, zoom: newZoom, panX: newPanX, panY: newPanY });
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
          onFocus={handleWindowFocus}
          onClose={handleWindowClose}
          onMove={handleWindowMove}
          onResize={handleWindowResize}
          onUrlChange={onUrlChange}
        />
      ))}
      <CreateWindowFab onCreateIframeWindow={handleCreateIframeWindow} />
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
