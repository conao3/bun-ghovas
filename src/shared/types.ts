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

export interface CanvasStateV2 {
  id: string;
  name?: string;
  viewport: { x: number; y: number; zoom: number };
  nodes: WorkspaceNode[];
}

export interface LayerState {
  canvases: CanvasStateV2[];
  uiMode: LayerUiMode;
  visible: boolean;
}

export interface WorkspaceState {
  layers: Record<LayerLevel, LayerState>;
}
