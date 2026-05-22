export function clampZoom(zoom: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, zoom));
}

export function zoomAtPoint(
  view: { panX: number; panY: number; zoom: number },
  cursorX: number,
  cursorY: number,
  factor: number,
  min: number,
  max: number,
): { panX: number; panY: number; zoom: number } {
  const newZoom = clampZoom(view.zoom * factor, min, max);
  const scale = newZoom / view.zoom;
  return {
    zoom: newZoom,
    panX: cursorX - scale * (cursorX - view.panX),
    panY: cursorY - scale * (cursorY - view.panY),
  };
}

export function centeredWindowPosition(
  containerW: number,
  containerH: number,
  view: { panX: number; panY: number; zoom: number },
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: (containerW / 2 - view.panX) / view.zoom - width / 2,
    y: (containerH / 2 - view.panY) / view.zoom - height / 2,
  };
}
