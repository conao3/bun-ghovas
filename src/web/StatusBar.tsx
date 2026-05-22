import type { LayerLevel } from "../shared/types";

interface StatusBarProps {
  activeIds: Record<LayerLevel, string>;
  zoom: number;
  focusedWindowTitle: string | null;
}

export function StatusBar({ activeIds, zoom, focusedWindowTitle }: StatusBarProps) {
  const zoomPct = Math.round(zoom * 100);
  const layerText = `L3:${activeIds[3]}  L2:${activeIds[2]}  L1:${activeIds[1]}  L0:${activeIds[0]}`;

  return (
    <div
      style={{
        gridArea: "bottom",
        height: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px",
        background: "#1e1e1e",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        color: "#888",
        fontSize: 11,
        fontFamily: "monospace",
        userSelect: "none",
      }}
    >
      <span>{layerText}</span>
      <span>{focusedWindowTitle ?? "—"}</span>
      <span>zoom {zoomPct}%</span>
    </div>
  );
}
