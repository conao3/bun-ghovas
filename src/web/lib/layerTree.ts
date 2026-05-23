import type {
  WorkspaceState,
  LayerLevel,
  L0Canvas,
  L1Canvas,
  L2Canvas,
  L3Canvas,
} from "../../shared/types";

export function getActiveL3(
  ws: Pick<WorkspaceState, "l3">,
  activeIds: Record<LayerLevel, string>,
): L3Canvas {
  return ws.l3.find((n) => n.id === activeIds[3]) ?? ws.l3[0]!;
}

export function getActiveL2(
  ws: Pick<WorkspaceState, "l2" | "l3">,
  activeIds: Record<LayerLevel, string>,
): L2Canvas {
  const l3 = getActiveL3(ws, activeIds);
  const candidates = ws.l2.filter((n) => n.parentL3 === l3.id);
  return candidates.find((n) => n.id === activeIds[2]) ?? candidates[0]!;
}

export function getActiveL1(
  ws: Pick<WorkspaceState, "l1" | "l2" | "l3">,
  activeIds: Record<LayerLevel, string>,
): L1Canvas {
  const l2 = getActiveL2(ws, activeIds);
  const candidates = ws.l1.filter((n) => n.parentL2 === l2.id);
  return candidates.find((n) => n.id === activeIds[1]) ?? candidates[0]!;
}

export function getActiveL0(
  ws: Pick<WorkspaceState, "l0" | "l1" | "l2" | "l3">,
  activeIds: Record<LayerLevel, string>,
): L0Canvas {
  const l1 = getActiveL1(ws, activeIds);
  const candidates = ws.l0.filter((n) => n.parentL1 === l1.id);
  return candidates.find((n) => n.id === activeIds[0]) ?? candidates[0]!;
}

export function getChildrenAt(
  ws: WorkspaceState,
  level: LayerLevel,
  activeIds: Record<LayerLevel, string>,
): L3Canvas[] | L2Canvas[] | L1Canvas[] | L0Canvas[] {
  if (level === 3) return ws.l3;
  if (level === 2) {
    const l3 = getActiveL3(ws, activeIds);
    return ws.l2.filter((n) => n.parentL3 === l3.id);
  }
  if (level === 1) {
    const l2 = getActiveL2(ws, activeIds);
    return ws.l1.filter((n) => n.parentL2 === l2.id);
  }
  const l1 = getActiveL1(ws, activeIds);
  return ws.l0.filter((n) => n.parentL1 === l1.id);
}

export function computeLayers(
  ws: Pick<WorkspaceState, "l0" | "l1" | "l2" | "l3" | "layerConfig">,
): WorkspaceState["layers"] {
  return {
    0: { canvases: ws.l0, uiMode: ws.layerConfig[0].uiMode, visible: ws.layerConfig[0].visible },
    1: { canvases: ws.l1, uiMode: ws.layerConfig[1].uiMode, visible: ws.layerConfig[1].visible },
    2: { canvases: ws.l2, uiMode: ws.layerConfig[2].uiMode, visible: ws.layerConfig[2].visible },
    3: { canvases: ws.l3, uiMode: ws.layerConfig[3].uiMode, visible: ws.layerConfig[3].visible },
  };
}
