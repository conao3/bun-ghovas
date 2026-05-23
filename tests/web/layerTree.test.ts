import { describe, it, expect } from "vitest";
import {
  getActiveL0,
  getActiveL1,
  getActiveL2,
  getActiveL3,
  getChildrenAt,
  computeLayers,
} from "../../src/web/lib/layerTree";
import type { WorkspaceState, LayerLevel } from "../../src/shared/types";

function makeWs(): WorkspaceState {
  const base = {
    l3: [{ id: "L3A" }],
    l2: [{ id: "L2A", parentL3: "L3A" }],
    l1: [
      { id: "L1A", parentL2: "L2A" },
      { id: "L1B", parentL2: "L2A" },
    ],
    l0: [
      { id: "C1", parentL1: "L1A", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
      { id: "C2", parentL1: "L1A", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
    ],
    layerConfig: {
      0: { uiMode: "horizontal-tabs" as const, visible: true },
      1: { uiMode: "horizontal-tabs" as const, visible: true },
      2: { uiMode: "horizontal-tabs" as const, visible: true },
      3: { uiMode: "horizontal-tabs" as const, visible: true },
    },
  };
  return { ...base, layers: computeLayers(base) };
}

describe("layerTree", () => {
  it("getActiveL0 returns the canvas matching activeIds[0]", () => {
    const ws = makeWs();
    const activeIds: Record<LayerLevel, string> = { 3: "L3A", 2: "L2A", 1: "L1A", 0: "C2" };
    expect(getActiveL0(ws, activeIds).id).toBe("C2");
  });

  it("getActiveL2 falls back to first child when activeIds[2] is unknown", () => {
    const ws = makeWs();
    const activeIds: Record<LayerLevel, string> = {
      3: "L3A",
      2: "nonexistent",
      1: "L1A",
      0: "C1",
    };
    expect(getActiveL2(ws, activeIds).id).toBe("L2A");
  });

  it("getChildrenAt(ws, 1, activeIds) returns L1 children of active L2", () => {
    const ws = makeWs();
    const activeIds: Record<LayerLevel, string> = { 3: "L3A", 2: "L2A", 1: "L1A", 0: "C1" };
    const children = getChildrenAt(ws, 1, activeIds);
    expect(children.map((c) => c.id)).toEqual(["L1A", "L1B"]);
  });

  it("getActiveL3 falls back to first L3 when activeIds[3] is unknown", () => {
    const ws = makeWs();
    const activeIds: Record<LayerLevel, string> = {
      3: "nonexistent",
      2: "L2A",
      1: "L1A",
      0: "C1",
    };
    expect(getActiveL3(ws, activeIds).id).toBe("L3A");
  });

  it("getActiveL1 returns the L1 matching activeIds[1] under active L2", () => {
    const ws = makeWs();
    const activeIds: Record<LayerLevel, string> = { 3: "L3A", 2: "L2A", 1: "L1B", 0: "C1" };
    expect(getActiveL1(ws, activeIds).id).toBe("L1B");
  });

  it("getActiveL0 works with minimal single-canvas-per-level structure", () => {
    const base = {
      l3: [{ id: "L3" }],
      l2: [{ id: "L2", parentL3: "L3" }],
      l1: [{ id: "L1", parentL2: "L2" }],
      l0: [{ id: "C0", parentL1: "L1", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] }],
      layerConfig: {
        0: { uiMode: "horizontal-tabs" as const, visible: true },
        1: { uiMode: "horizontal-tabs" as const, visible: true },
        2: { uiMode: "horizontal-tabs" as const, visible: true },
        3: { uiMode: "horizontal-tabs" as const, visible: true },
      },
    };
    const ws: WorkspaceState = { ...base, layers: computeLayers(base) };
    const activeIds: Record<LayerLevel, string> = { 3: "L3", 2: "L2", 1: "L1", 0: "C0" };
    expect(getActiveL0(ws, activeIds).id).toBe("C0");
  });
});
