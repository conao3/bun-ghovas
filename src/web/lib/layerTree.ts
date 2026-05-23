import type {
  WorkspaceState,
  LayerLevel,
  L0Canvas,
  L1Canvas,
  L2Canvas,
  L3Canvas,
  WorkspaceNode,
} from "../../shared/types";

type BaseWorkspace = Pick<WorkspaceState, "l0" | "l1" | "l2" | "l3">;

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

export function appendCanvas(
  ws: BaseWorkspace,
  level: LayerLevel,
  activeIds: Record<LayerLevel, string>,
  newId: string,
): BaseWorkspace {
  if (level === 3) {
    return { ...ws, l3: [...ws.l3, { id: newId } satisfies L3Canvas] };
  } else if (level === 2) {
    return { ...ws, l2: [...ws.l2, { id: newId, parentL3: activeIds[3] } satisfies L2Canvas] };
  } else if (level === 1) {
    return { ...ws, l1: [...ws.l1, { id: newId, parentL2: activeIds[2] } satisfies L1Canvas] };
  }
  const newCanvas: L0Canvas = {
    id: newId,
    parentL1: activeIds[1],
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
  };
  return { ...ws, l0: [...ws.l0, newCanvas] };
}

export function removeSubtree(
  ws: BaseWorkspace,
  level: LayerLevel,
  canvasId: string,
): BaseWorkspace {
  if (level === 0) {
    const target = ws.l0.find((c) => c.id === canvasId);
    if (!target) return ws;
    if (ws.l0.filter((c) => c.parentL1 === target.parentL1).length <= 1) return ws;
    return { ...ws, l0: ws.l0.filter((c) => c.id !== canvasId) };
  } else if (level === 1) {
    const target = ws.l1.find((c) => c.id === canvasId);
    if (!target) return ws;
    if (ws.l1.filter((c) => c.parentL2 === target.parentL2).length <= 1) return ws;
    return {
      ...ws,
      l1: ws.l1.filter((c) => c.id !== canvasId),
      l0: ws.l0.filter((c) => c.parentL1 !== canvasId),
    };
  } else if (level === 2) {
    const target = ws.l2.find((c) => c.id === canvasId);
    if (!target) return ws;
    if (ws.l2.filter((c) => c.parentL3 === target.parentL3).length <= 1) return ws;
    const deletedL1Ids = new Set(ws.l1.filter((c) => c.parentL2 === canvasId).map((c) => c.id));
    return {
      ...ws,
      l2: ws.l2.filter((c) => c.id !== canvasId),
      l1: ws.l1.filter((c) => c.parentL2 !== canvasId),
      l0: ws.l0.filter((c) => !deletedL1Ids.has(c.parentL1)),
    };
  }
  if (ws.l3.length <= 1) return ws;
  const deletedL2Ids = new Set(ws.l2.filter((c) => c.parentL3 === canvasId).map((c) => c.id));
  const deletedL1Ids = new Set(ws.l1.filter((c) => deletedL2Ids.has(c.parentL2)).map((c) => c.id));
  return {
    ...ws,
    l3: ws.l3.filter((c) => c.id !== canvasId),
    l2: ws.l2.filter((c) => c.parentL3 !== canvasId),
    l1: ws.l1.filter((c) => !deletedL2Ids.has(c.parentL2)),
    l0: ws.l0.filter((c) => !deletedL1Ids.has(c.parentL1)),
  };
}

export function duplicateSubtree(
  ws: BaseWorkspace,
  level: LayerLevel,
  canvasId: string,
  cloneNodes: (nodes: WorkspaceNode[]) => WorkspaceNode[],
): BaseWorkspace {
  const newId = crypto.randomUUID();
  if (level === 0) {
    const idx = ws.l0.findIndex((c) => c.id === canvasId);
    if (idx === -1) return ws;
    const orig = ws.l0[idx]!;
    const clone: L0Canvas = {
      ...orig,
      id: newId,
      name: (orig.name ?? orig.id) + " copy",
      nodes: cloneNodes(orig.nodes),
    };
    const next = [...ws.l0];
    next.splice(idx + 1, 0, clone);
    return { ...ws, l0: next };
  } else if (level === 1) {
    const idx = ws.l1.findIndex((c) => c.id === canvasId);
    if (idx === -1) return ws;
    const orig = ws.l1[idx]!;
    const clone: L1Canvas = { ...orig, id: newId, name: (orig.name ?? orig.id) + " copy" };
    const nextL1 = [...ws.l1];
    nextL1.splice(idx + 1, 0, clone);
    const clonedL0 = ws.l0
      .filter((c) => c.parentL1 === canvasId)
      .map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        parentL1: newId,
        nodes: cloneNodes(c.nodes),
      }));
    return { ...ws, l1: nextL1, l0: [...ws.l0, ...clonedL0] };
  } else if (level === 2) {
    const idx = ws.l2.findIndex((c) => c.id === canvasId);
    if (idx === -1) return ws;
    const orig = ws.l2[idx]!;
    const clone: L2Canvas = { ...orig, id: newId, name: (orig.name ?? orig.id) + " copy" };
    const nextL2 = [...ws.l2];
    nextL2.splice(idx + 1, 0, clone);
    const childL1 = ws.l1.filter((c) => c.parentL2 === canvasId);
    const l1IdMap = new Map(childL1.map((c) => [c.id, crypto.randomUUID()]));
    const clonedL1 = childL1.map((c) => ({ ...c, id: l1IdMap.get(c.id)!, parentL2: newId }));
    const clonedL0 = ws.l0
      .filter((c) => l1IdMap.has(c.parentL1))
      .map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        parentL1: l1IdMap.get(c.parentL1)!,
        nodes: cloneNodes(c.nodes),
      }));
    return { ...ws, l2: nextL2, l1: [...ws.l1, ...clonedL1], l0: [...ws.l0, ...clonedL0] };
  }
  const idx = ws.l3.findIndex((c) => c.id === canvasId);
  if (idx === -1) return ws;
  const orig = ws.l3[idx]!;
  const clone: L3Canvas = { ...orig, id: newId, name: (orig.name ?? orig.id) + " copy" };
  const nextL3 = [...ws.l3];
  nextL3.splice(idx + 1, 0, clone);
  const childL2 = ws.l2.filter((c) => c.parentL3 === canvasId);
  const l2IdMap = new Map(childL2.map((c) => [c.id, crypto.randomUUID()]));
  const clonedL2 = childL2.map((c) => ({ ...c, id: l2IdMap.get(c.id)!, parentL3: newId }));
  const childL1 = ws.l1.filter((c) => l2IdMap.has(c.parentL2));
  const l1IdMap = new Map(childL1.map((c) => [c.id, crypto.randomUUID()]));
  const clonedL1 = childL1.map((c) => ({
    ...c,
    id: l1IdMap.get(c.id)!,
    parentL2: l2IdMap.get(c.parentL2)!,
  }));
  const clonedL0 = ws.l0
    .filter((c) => l1IdMap.has(c.parentL1))
    .map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      parentL1: l1IdMap.get(c.parentL1)!,
      nodes: cloneNodes(c.nodes),
    }));
  return {
    ...ws,
    l3: nextL3,
    l2: [...ws.l2, ...clonedL2],
    l1: [...ws.l1, ...clonedL1],
    l0: [...ws.l0, ...clonedL0],
  };
}

export function reorderCanvases(
  ws: BaseWorkspace,
  level: LayerLevel,
  activeId: string,
  overId: string,
): BaseWorkspace {
  if (activeId === overId) return ws;
  function move<T>(arr: T[], fromIdx: number, toIdx: number): T[] {
    const next = [...arr];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item!);
    return next;
  }
  if (level === 3) {
    const from = ws.l3.findIndex((c) => c.id === activeId);
    const to = ws.l3.findIndex((c) => c.id === overId);
    if (from === -1 || to === -1) return ws;
    return { ...ws, l3: move(ws.l3, from, to) };
  } else if (level === 2) {
    const from = ws.l2.findIndex((c) => c.id === activeId);
    const to = ws.l2.findIndex((c) => c.id === overId);
    if (from === -1 || to === -1) return ws;
    return { ...ws, l2: move(ws.l2, from, to) };
  } else if (level === 1) {
    const from = ws.l1.findIndex((c) => c.id === activeId);
    const to = ws.l1.findIndex((c) => c.id === overId);
    if (from === -1 || to === -1) return ws;
    return { ...ws, l1: move(ws.l1, from, to) };
  }
  const from = ws.l0.findIndex((c) => c.id === activeId);
  const to = ws.l0.findIndex((c) => c.id === overId);
  if (from === -1 || to === -1) return ws;
  return { ...ws, l0: move(ws.l0, from, to) };
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
