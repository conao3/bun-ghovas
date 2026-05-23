export interface SessionMeta {
  id: string;
  alive: boolean;
  createdAt: number;
}

type WindowKind = "terminal" | "iframe";

export interface WindowState {
  id: string;
  kind: WindowKind;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  sessionId?: string;
  url?: string;
}

export type LayerLevel = 0 | 1 | 2 | 3;

export type LayerUiMode = "horizontal-tabs" | "floating" | "vertical-tabs";

export interface WorkspaceNode {
  id: string;
  type: "window";
  position: { x: number; y: number };
  width: number;
  height: number;
  data: WindowState;
}

export interface L3Canvas {
  id: string;
  name?: string;
}

export interface L2Canvas {
  id: string;
  name?: string;
  parentL3: string;
}

export interface L1Canvas {
  id: string;
  name?: string;
  parentL2: string;
}

export interface L0Canvas {
  id: string;
  name?: string;
  statusHint?: "ok" | "warn" | "err";
  parentL1: string;
  viewport: { x: number; y: number; zoom: number };
  nodes: WorkspaceNode[];
}

export interface LayerConfig {
  uiMode: LayerUiMode;
  visible: boolean;
}

export interface WorkspaceState {
  l3: L3Canvas[];
  l2: L2Canvas[];
  l1: L1Canvas[];
  l0: L0Canvas[];
  layerConfig: Record<LayerLevel, LayerConfig>;
}
