import { describe, it, expect } from "vitest";
import { migrateWorkspace } from "../../src/web/lib/workspaceMigration";

const emptyLegacyLayer = (id: string) => ({
  canvases: [{ id, windows: [], panX: 0, panY: 0, zoom: 1 }],
  uiMode: "horizontal-tabs",
  visible: true,
});

const emptyNewLayer = (id: string) => ({
  canvases: [{ id, viewport: { x: 0, y: 0, zoom: 1 }, nodes: [] }],
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

    const canvas = result.layers[0].canvases[0]!;
    expect(canvas.viewport).toEqual({ x: 10, y: 20, zoom: 1.5 });
    expect(canvas.nodes).toHaveLength(1);

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
    const node = result.layers[0].canvases[0]!.nodes[0]!;
    expect(node.data.kind).toBe("iframe");
    expect(node.data.url).toBe("https://example.com");
    expect(node.data.title).toBe("Browser");
  });

  it("is idempotent for new format", () => {
    const newFormat = {
      layers: {
        0: {
          canvases: [{ id: "c1", viewport: { x: 5, y: 10, zoom: 0.8 }, nodes: [] }],
          uiMode: "horizontal-tabs",
          visible: true,
        },
        1: emptyNewLayer("a"),
        2: emptyNewLayer("b"),
        3: emptyNewLayer("c"),
      },
    };

    const result = migrateWorkspace(newFormat);
    expect(result).toEqual(newFormat);
  });
});
