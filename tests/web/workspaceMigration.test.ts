import { describe, it, expect } from "vitest";
import { migrateWorkspace } from "../../src/web/lib/workspaceMigration";
import { computeLayers } from "../../src/web/lib/layerTree";

const emptyLegacyLayer = (id: string) => ({
  canvases: [{ id, windows: [], panX: 0, panY: 0, zoom: 1 }],
  uiMode: "horizontal-tabs",
  visible: true,
});

describe("migrateWorkspace", () => {
  it("converts legacy format to new format", () => {
    const legacy = {
      layers: {
        0: {
          canvases: [
            {
              id: "c1",
              windows: [
                {
                  id: "w1",
                  kind: "terminal",
                  x: 100,
                  y: 200,
                  width: 400,
                  height: 300,
                  title: "Term",
                  sessionId: "s1",
                },
              ],
              panX: 10,
              panY: 20,
              zoom: 1.5,
            },
          ],
          uiMode: "horizontal-tabs",
          visible: true,
        },
        1: emptyLegacyLayer("a"),
        2: emptyLegacyLayer("b"),
        3: emptyLegacyLayer("c"),
      },
    };

    const result = migrateWorkspace(legacy);

    const canvas = result.l0[0]!;
    expect(canvas.viewport).toEqual({ x: 10, y: 20, zoom: 1.5 });
    expect(canvas.nodes).toHaveLength(1);
    expect(canvas.parentL1).toBe("default-l1");

    const node = canvas.nodes[0]!;
    expect(node.id).toBe("w1");
    expect(node.type).toBe("window");
    expect(node.position).toEqual({ x: 100, y: 200 });
    expect(node.width).toBe(400);
    expect(node.height).toBe(300);
    expect(node.data.kind).toBe("terminal");
    expect(node.data.title).toBe("Term");
    expect(node.data.sessionId).toBe("s1");
    expect(node.data.x).toBe(100);
    expect(node.data.y).toBe(200);

    expect("windows" in canvas).toBe(false);
    expect("panX" in canvas).toBe(false);
    expect("panY" in canvas).toBe(false);
    expect("zoom" in canvas).toBe(false);
  });

  it("converts iframe window preserving url", () => {
    const legacy = {
      layers: {
        0: {
          canvases: [
            {
              id: "c1",
              windows: [
                {
                  id: "w2",
                  kind: "iframe",
                  x: 50,
                  y: 60,
                  width: 480,
                  height: 320,
                  title: "Browser",
                  url: "https://example.com",
                },
              ],
              panX: 0,
              panY: 0,
              zoom: 1,
            },
          ],
          uiMode: "horizontal-tabs",
          visible: true,
        },
        1: emptyLegacyLayer("a"),
        2: emptyLegacyLayer("b"),
        3: emptyLegacyLayer("c"),
      },
    };

    const result = migrateWorkspace(legacy);
    const node = result.l0[0]!.nodes[0]!;
    expect(node.data.kind).toBe("iframe");
    expect(node.data.url).toBe("https://example.com");
    expect(node.data.title).toBe("Browser");
  });

  it("is idempotent for new format", () => {
    const base = {
      l3: [{ id: "default-l3", name: "L3" }],
      l2: [{ id: "default-l2", name: "L2", parentL3: "default-l3" }],
      l1: [{ id: "default-l1", name: "L1", parentL2: "default-l2" }],
      l0: [
        {
          id: "c1",
          parentL1: "default-l1",
          viewport: { x: 5, y: 10, zoom: 0.8 },
          nodes: [],
        },
      ],
      layerConfig: {
        0: { uiMode: "horizontal-tabs", visible: true },
        1: { uiMode: "horizontal-tabs", visible: true },
        2: { uiMode: "horizontal-tabs", visible: true },
        3: { uiMode: "horizontal-tabs", visible: true },
      },
    };
    const newFormat = { ...base, layers: computeLayers(base) };

    const result = migrateWorkspace(newFormat);
    expect(result).toEqual(newFormat);
  });

  it("migrates V2 format to V3 format", () => {
    const v2 = {
      layers: {
        0: {
          canvases: [
            { id: "canvas-1", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
            { id: "canvas-2", viewport: { x: 10, y: 20, zoom: 1.5 }, nodes: [] },
          ],
          uiMode: "floating",
          visible: true,
        },
        1: {
          canvases: [
            { id: "alpha", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
            { id: "beta", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
          ],
          uiMode: "vertical-tabs",
          visible: false,
        },
        2: {
          canvases: [
            { id: "ui", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
            { id: "api", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
          ],
          uiMode: "horizontal-tabs",
          visible: true,
        },
        3: {
          canvases: [
            { id: "main", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
            { id: "docs", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] },
          ],
          uiMode: "horizontal-tabs",
          visible: true,
        },
      },
    };

    const result = migrateWorkspace(v2);

    expect(result.l0).toHaveLength(2);
    expect(result.l0.every((c) => c.parentL1 === "default-l1")).toBe(true);
    expect(result.l0[0]!.id).toBe("canvas-1");
    expect(result.l0[1]!.id).toBe("canvas-2");

    expect(result.l1).toHaveLength(1);
    expect(result.l1[0]!.id).toBe("default-l1");
    expect(result.l2).toHaveLength(1);
    expect(result.l2[0]!.id).toBe("default-l2");
    expect(result.l3).toHaveLength(1);
    expect(result.l3[0]!.id).toBe("default-l3");

    expect(result.layerConfig[0].uiMode).toBe("floating");
    expect(result.layerConfig[0].visible).toBe(true);
    expect(result.layerConfig[1].uiMode).toBe("vertical-tabs");
    expect(result.layerConfig[1].visible).toBe(false);
    expect(result.layerConfig[2].uiMode).toBe("horizontal-tabs");
    expect(result.layerConfig[3].uiMode).toBe("horizontal-tabs");

    const l0Ids = result.l0.map((c) => c.id);
    expect(l0Ids).not.toContain("alpha");
    expect(l0Ids).not.toContain("beta");
    expect(l0Ids).not.toContain("ui");
    expect(l0Ids).not.toContain("api");
    expect(l0Ids).not.toContain("main");
    expect(l0Ids).not.toContain("docs");
  });
});
