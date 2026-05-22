import { useState, useRef, useCallback, useEffect } from "react";
import type { CanvasState } from "../shared/types";
import { Window } from "./Window";

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

export function Canvas() {
  const [state, setState] = useState<CanvasState>({
    id: "canvas-0",
    windows: [
      { id: "w1", kind: "terminal", x: 80, y: 60, width: 420, height: 300, title: "Terminal 1" },
      { id: "w2", kind: "terminal", x: 540, y: 100, width: 400, height: 280, title: "Terminal 2" },
      { id: "w3", kind: "iframe", x: 180, y: 420, width: 460, height: 320, title: "Browser" },
    ],
    panX: 0,
    panY: 0,
    zoom: 1,
  });
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>("w1");

  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWindowFocus = useCallback((id: string) => {
    setFocusedWindowId(id);
  }, []);

  const handleWindowClose = useCallback((id: string) => {
    setState((prev) => ({ ...prev, windows: prev.windows.filter((w) => w.id !== id) }));
    setFocusedWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const handleWindowMove = useCallback((id: string, x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      windows: prev.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }));
  }, []);

  const handleWindowResize = useCallback(
    (id: string, x: number, y: number, width: number, height: number) => {
      setState((prev) => ({
        ...prev,
        windows: prev.windows.map((w) => (w.id === id ? { ...w, x, y, width, height } : w)),
      }));
    },
    [],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setState((prev) => ({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    setState((prev) => {
      const delta = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * delta));
      const scale = newZoom / prev.zoom;
      const newPanX = cursorX - scale * (cursorX - prev.panX);
      const newPanY = cursorY - scale * (cursorY - prev.panY);
      return { ...prev, zoom: newZoom, panX: newPanX, panY: newPanY };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const zoomPct = Math.round(state.zoom * 100);
  const viewX = Math.round(-state.panX / state.zoom);
  const viewY = Math.round(-state.panY / state.zoom);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        cursor: dragging.current ? "grabbing" : "grab",
        background: "#1a1a1a",
        userSelect: "none",
      }}
    >
      <Grid panX={state.panX} panY={state.panY} zoom={state.zoom} />
      {state.windows.map((win) => (
        <Window
          key={win.id}
          win={win}
          panX={state.panX}
          panY={state.panY}
          zoom={state.zoom}
          isFocused={focusedWindowId === win.id}
          onFocus={handleWindowFocus}
          onClose={handleWindowClose}
          onMove={handleWindowMove}
          onResize={handleWindowResize}
        />
      ))}
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
