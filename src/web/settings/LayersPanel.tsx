import { Layers } from "lucide-react";
import type { WorkspaceState, LayerLevel, LayerUiMode } from "../../shared/types";
import { PanelHeader } from "./PanelHeader";

function layerDescription(level: LayerLevel): string {
  if (level === 3) return "Top-most. Persona / context.";
  if (level === 2) return "Mid. Project / domain.";
  return "Bottom. Task / focus.";
}

const UI_MODES: { value: LayerUiMode; label: string }[] = [
  { value: "horizontal-tabs", label: "Horizontal" },
  { value: "vertical-tabs", label: "Vertical" },
  { value: "floating", label: "Floating" },
];

function UiModePreview({ mode }: { mode: LayerUiMode }) {
  return (
    <div
      style={{
        width: "100%",
        height: 80,
        background: "var(--color-surface-dark)",
        borderRadius: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {mode === "horizontal-tabs" && (
        <div
          style={{
            height: 22,
            background: "var(--color-surface-dark-soft)",
            borderBottom: "1px solid var(--color-dark-hairline)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "0 8px",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 36,
                height: 14,
                background: i === 1 ? "transparent" : "var(--color-surface-dark-elevated)",
                borderRadius: 3,
                boxShadow: i === 1 ? "inset 0 -2px 0 var(--color-primary)" : "none",
              }}
            />
          ))}
        </div>
      )}
      {mode === "vertical-tabs" && (
        <div
          style={{
            width: 54,
            height: "100%",
            background: "var(--color-surface-dark-soft)",
            borderRight: "1px solid var(--color-dark-hairline)",
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                height: 12,
                background: i === 1 ? "var(--color-surface-dark-elevated)" : "transparent",
                borderRadius: 3,
                borderLeft: i === 1 ? "2px solid var(--color-primary)" : "2px solid transparent",
              }}
            />
          ))}
        </div>
      )}
      {mode === "floating" && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            height: 22,
            padding: "0 8px",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "var(--color-surface-dark-soft)",
            borderRadius: 999,
            border: "1px solid var(--color-dark-hairline)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 24,
                height: 12,
                background: i === 1 ? "var(--color-surface-dark-elevated)" : "transparent",
                borderRadius: 6,
              }}
            />
          ))}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 6,
          right: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: "var(--color-on-dark-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        PREVIEW
      </div>
    </div>
  );
}

function LayerRow(props: {
  level: LayerLevel;
  uiMode: LayerUiMode;
  visible: boolean;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
}) {
  const { level, uiMode, visible } = props;

  return (
    <div className="py-4 border-b border-hairline-soft last:border-b-0">
      <h3 className="text-ink font-medium text-[14px] mt-0 mb-0.5">Layer {level}</h3>
      <div className="text-muted text-[12px] mt-0.5 mb-3">{layerDescription(level)}</div>
      <div className="flex items-center gap-4 mb-3">
        <div className="inline-flex bg-surface-card rounded-md p-[3px] gap-[2px]">
          {UI_MODES.map((opt) => {
            const isActive = uiMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => props.onUiModeChange(level, opt.value)}
                style={{
                  background: isActive ? "var(--color-canvas)" : "transparent",
                  border: 0,
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: isActive ? "var(--color-ink)" : "var(--color-body)",
                  padding: "6px 14px",
                  borderRadius: 5,
                  cursor: "pointer",
                  boxShadow: isActive ? "0 1px 2px rgba(20,20,19,0.08)" : "none",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none text-muted text-[12px]">
          <input
            type="checkbox"
            role="switch"
            className="sr-only"
            checked={visible}
            onChange={(e) => props.onVisibilityChange(level, e.target.checked)}
          />
          <span
            style={{
              display: "inline-block",
              width: 32,
              height: 18,
              background: visible ? "var(--color-primary)" : "var(--color-hairline)",
              borderRadius: 9999,
              position: "relative",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: visible ? 16 : 2,
                width: 14,
                height: 14,
                background: "white",
                borderRadius: "50%",
                transition: "left 0.15s",
              }}
            />
          </span>
          Visible
        </label>
      </div>
      <UiModePreview mode={uiMode} />
    </div>
  );
}

export function LayersPanel(props: {
  workspace: WorkspaceState;
  activeIds: Record<LayerLevel, string>;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
}) {
  const { workspace } = props;
  const levels: LayerLevel[] = [3, 2, 1];

  return (
    <div>
      <PanelHeader icon={Layers} title="Layers" />
      <div>
        {levels.map((level) => {
          const config = workspace.layerConfig[level];
          return (
            <LayerRow
              key={level}
              level={level}
              uiMode={config.uiMode}
              visible={config.visible}
              onUiModeChange={props.onUiModeChange}
              onVisibilityChange={props.onVisibilityChange}
            />
          );
        })}
      </div>
    </div>
  );
}
