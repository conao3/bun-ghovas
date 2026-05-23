import type {
  WorkspaceState,
  WorkspaceNode,
  LayerUiMode,
  L0Canvas,
  L1Canvas,
  L2Canvas,
  L3Canvas,
  LayerConfig,
} from "../../shared/types";

type LegacyWindow = {
  id: string;
  kind: "terminal" | "iframe";
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  sessionId?: string;
  url?: string;
};

function migrateL0(canvas: Record<string, unknown>, parentL1: string): L0Canvas {
  if ("windows" in canvas) {
    const windows = (canvas.windows ?? []) as LegacyWindow[];
    const nodes: WorkspaceNode[] = windows.map((win) => ({
      id: win.id,
      type: "window" as const,
      position: { x: win.x, y: win.y },
      width: win.width,
      height: win.height,
      data: {
        id: win.id,
        kind: win.kind,
        x: win.x,
        y: win.y,
        width: win.width,
        height: win.height,
        title: win.title,
        ...(win.sessionId != null ? { sessionId: win.sessionId } : {}),
        ...(win.url != null ? { url: win.url } : {}),
      },
    }));
    return {
      id: canvas.id as string,
      ...(canvas.name != null ? { name: canvas.name as string } : {}),
      parentL1,
      viewport: {
        x: (canvas.panX as number) ?? 0,
        y: (canvas.panY as number) ?? 0,
        zoom: (canvas.zoom as number) ?? 1,
      },
      nodes,
    };
  }
  return { ...(canvas as unknown as L0Canvas), parentL1 };
}

export function migrateWorkspace(raw: unknown): WorkspaceState {
  const obj = raw as Record<string, unknown>;

  if ("l0" in obj && "l1" in obj && "l2" in obj && "l3" in obj && "layerConfig" in obj) {
    return obj as unknown as WorkspaceState;
  }

  const layers = obj.layers as Record<
    string,
    { canvases: unknown[]; uiMode: string; visible: boolean }
  >;

  const defaultL1Id = "default-l1";
  const defaultL2Id = "default-l2";
  const defaultL3Id = "default-l3";

  const l0: L0Canvas[] = (layers[0]?.canvases ?? []).map((c) =>
    migrateL0(c as Record<string, unknown>, defaultL1Id),
  );

  const l1: L1Canvas[] = [{ id: defaultL1Id, name: "L1", parentL2: defaultL2Id }];
  const l2: L2Canvas[] = [{ id: defaultL2Id, name: "L2", parentL3: defaultL3Id }];
  const l3: L3Canvas[] = [{ id: defaultL3Id, name: "L3" }];

  const layerConfig: WorkspaceState["layerConfig"] = {
    0: { uiMode: (layers[0]?.uiMode ?? "horizontal-tabs") as LayerUiMode, visible: layers[0]?.visible ?? true } satisfies LayerConfig,
    1: { uiMode: (layers[1]?.uiMode ?? "horizontal-tabs") as LayerUiMode, visible: layers[1]?.visible ?? true } satisfies LayerConfig,
    2: { uiMode: (layers[2]?.uiMode ?? "horizontal-tabs") as LayerUiMode, visible: layers[2]?.visible ?? true } satisfies LayerConfig,
    3: { uiMode: (layers[3]?.uiMode ?? "horizontal-tabs") as LayerUiMode, visible: layers[3]?.visible ?? true } satisfies LayerConfig,
  };

  return { l3, l2, l1, l0, layerConfig };
}
