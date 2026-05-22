import { describe, test, expect } from "bun:test";
import { clampZoom, zoomAtPoint, centeredWindowPosition } from "../../src/web/lib/canvasGeometry";

describe("clampZoom", () => {
  test("value below min is clamped to min", () => {
    expect(clampZoom(0.1, 0.25, 2)).toBe(0.25);
  });

  test("value above max is clamped to max", () => {
    expect(clampZoom(5, 0.25, 2)).toBe(2);
  });

  test("value within range is returned unchanged", () => {
    expect(clampZoom(1, 0.25, 2)).toBe(1);
  });
});

describe("zoomAtPoint", () => {
  test("cursor point maps to the same canvas coordinate before and after zoom (fixed-point invariant)", () => {
    const view = { panX: 100, panY: 50, zoom: 1 };
    const cursorX = 400;
    const cursorY = 300;
    const factor = 1.1;

    const canvasBefore = {
      x: (cursorX - view.panX) / view.zoom,
      y: (cursorY - view.panY) / view.zoom,
    };

    const result = zoomAtPoint(view, cursorX, cursorY, factor, 0.25, 2);

    const canvasAfter = {
      x: (cursorX - result.panX) / result.zoom,
      y: (cursorY - result.panY) / result.zoom,
    };

    expect(canvasAfter.x).toBeCloseTo(canvasBefore.x, 10);
    expect(canvasAfter.y).toBeCloseTo(canvasBefore.y, 10);
  });

  test("zoom is clamped at max bound", () => {
    const view = { panX: 0, panY: 0, zoom: 1.9 };
    const result = zoomAtPoint(view, 200, 200, 1.1, 0.25, 2);
    expect(result.zoom).toBe(2);
  });

  test("zoom is clamped at min bound", () => {
    const view = { panX: 0, panY: 0, zoom: 0.3 };
    const result = zoomAtPoint(view, 200, 200, 0.8, 0.25, 2);
    expect(result.zoom).toBe(0.25);
  });
});

describe("centeredWindowPosition", () => {
  test("window is centered with pan=0 and zoom=1", () => {
    const view = { panX: 0, panY: 0, zoom: 1 };
    const { x, y } = centeredWindowPosition(800, 600, view, 200, 100);
    expect(x).toBe(300);
    expect(y).toBe(250);
  });

  test("window is centered with non-zero pan", () => {
    const view = { panX: 50, panY: -30, zoom: 1 };
    const { x, y } = centeredWindowPosition(800, 600, view, 200, 100);
    expect(x).toBe(250);
    expect(y).toBe(280);
  });

  test("window is centered with zoom=2", () => {
    const view = { panX: 0, panY: 0, zoom: 2 };
    const { x, y } = centeredWindowPosition(800, 600, view, 200, 100);
    expect(x).toBe(100);
    expect(y).toBe(100);
  });
});
