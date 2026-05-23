import type { WorkspaceState, WorkspaceNode, LayerUiMode } from "../../shared/types";

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

function migrateCanvas(
  canvas: Record<string, unknown>,
): WorkspaceState["layers"][0]["canvases"][0] {
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
      viewport: {
        x: (canvas.panX as number) ?? 0,
        y: (canvas.panY as number) ?? 0,
        zoom: (canvas.zoom as number) ?? 1,
      },
      nodes,
    };
  }
  return canvas as unknown as WorkspaceState["layers"][0]["canvases"][0];
}

export function migrateWorkspace(raw: unknown): WorkspaceState {
  const obj = raw as Record<string, unknown>;
  const layers = obj.layers as Record<
    string,
    { canvases: unknown[]; uiMode: string; visible: boolean }
  >;

  const migratedLayers = {} as WorkspaceState["layers"];

  for (const [levelStr, layer] of Object.entries(layers)) {
    const level = Number(levelStr) as 0 | 1 | 2 | 3;
    migratedLayers[level] = {
      canvases: layer.canvases.map((c) => migrateCanvas(c as Record<string, unknown>)),
      uiMode: layer.uiMode as LayerUiMode,
      visible: layer.visible,
    };
  }

  return { layers: migratedLayers };
}
