export type WindowKind = "terminal" | "iframe";

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

export interface CanvasState {
  id: string;
  windows: WindowState[];
  panX: number;
  panY: number;
  zoom: number;
}

export interface LayerState {
  canvases: CanvasState[];
  uiMode: LayerUiMode;
  visible: boolean;
}

export interface WorkspaceState {
  layers: Record<LayerLevel, LayerState>;
}
