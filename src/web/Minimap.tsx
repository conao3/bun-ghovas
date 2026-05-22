import type { WindowState } from "../shared/types";

const MINIMAP_W = 160;
const MINIMAP_H = 100;

interface MinimapProps {
  windows: WindowState[];
  panX: number;
  panY: number;
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  onPanTo: (panX: number, panY: number) => void;
}

export function Minimap({ windows, panX, panY, zoom, containerWidth, containerHeight, onPanTo }: MinimapProps) {
  let extMinX: number, extMinY: number, extMaxX: number, extMaxY: number;
  if (windows.length === 0) {
    extMinX = -2000;
    extMinY = -2000;
    extMaxX = 2000;
    extMaxY = 2000;
  } else {
    extMinX = Math.min(...windows.map((w) => w.x)) - 200;
    extMinY = Math.min(...windows.map((w) => w.y)) - 200;
    extMaxX = Math.max(...windows.map((w) => w.x + w.width)) + 200;
    extMaxY = Math.max(...windows.map((w) => w.y + w.height)) + 200;
  }

  const extW = extMaxX - extMinX;
  const extH = extMaxY - extMinY;

  const scaleX = MINIMAP_W / extW;
  const scaleY = MINIMAP_H / extH;
  const scale = Math.min(scaleX, scaleY);

  const drawW = extW * scale;
  const drawH = extH * scale;
  const offsetX = (MINIMAP_W - drawW) / 2;
  const offsetY = (MINIMAP_H - drawH) / 2;

  function toMapX(vx: number) {
    return offsetX + (vx - extMinX) * scale;
  }
  function toMapY(vy: number) {
    return offsetY + (vy - extMinY) * scale;
  }

  const vpLeft = -panX / zoom;
  const vpTop = -panY / zoom;
  const vpRight = (-panX + containerWidth) / zoom;
  const vpBottom = (-panY + containerHeight) / zoom;

  const vpMapX = toMapX(vpLeft);
  const vpMapY = toMapY(vpTop);
  const vpMapW = (vpRight - vpLeft) * scale;
  const vpMapH = (vpBottom - vpTop) * scale;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const virtualX = extMinX + (mx - offsetX) / scale;
    const virtualY = extMinY + (my - offsetY) / scale;
    const newPanX = -(virtualX * zoom) + containerWidth / 2;
    const newPanY = -(virtualY * zoom) + containerHeight / 2;
    onPanTo(newPanX, newPanY);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{
        position: "absolute",
        bottom: 40,
        right: 16,
        width: MINIMAP_W,
        height: MINIMAP_H,
        background: "rgba(20,20,20,0.85)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 4,
        zIndex: 5,
        overflow: "hidden",
        cursor: "crosshair",
      }}
    >
      {windows.map((w) => (
        <div
          key={w.id}
          style={{
            position: "absolute",
            left: toMapX(w.x),
            top: toMapY(w.y),
            width: w.width * scale,
            height: w.height * scale,
            background: "rgba(74,158,255,0.4)",
            pointerEvents: "none",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: vpMapX,
          top: vpMapY,
          width: vpMapW,
          height: vpMapH,
          border: "1.5px solid #4a9eff",
          pointerEvents: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
