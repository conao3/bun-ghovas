import { useState } from "react";
import { Modal } from "./components/Modal";
import { GeneralPanel } from "./settings/GeneralPanel";
import { LayersPanel } from "./settings/LayersPanel";
import { KeyboardPanel } from "./settings/KeyboardPanel";
import { BackendPanel } from "./settings/BackendPanel";
import { WorkspacesPanel } from "./settings/WorkspacesPanel";
import { AboutPanel } from "./settings/AboutPanel";
import type { WorkspaceState, LayerLevel, LayerUiMode } from "../shared/types";

type NavEntry = "General" | "Layers" | "Keyboard" | "Backend" | "Workspaces" | "About";

const NAV_ENTRIES: NavEntry[] = ["General", "Layers", "Keyboard", "Backend", "Workspaces", "About"];

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceState;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
  onWorkspaceReplace: (next: WorkspaceState) => void;
}

export function Settings({
  isOpen,
  onClose,
  workspace,
  onUiModeChange,
  onVisibilityChange,
  onWorkspaceReplace,
}: SettingsProps) {
  const [selected, setSelected] = useState<NavEntry>("General");

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ display: "flex", gap: 0, minWidth: 560, minHeight: 360 }}>
        <nav
          style={{
            width: 140,
            borderRight: "1px solid rgba(255,255,255,0.1)",
            paddingRight: 12,
            marginRight: 12,
          }}
        >
          {NAV_ENTRIES.map((entry) => (
            <div
              key={entry}
              onClick={() => setSelected(entry)}
              style={{
                padding: "6px 10px",
                borderRadius: 3,
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: 13,
                color: selected === entry ? "#fff" : "rgba(255,255,255,0.5)",
                background: selected === entry ? "rgba(255,255,255,0.12)" : "transparent",
              }}
            >
              {entry}
            </div>
          ))}
        </nav>
        <div style={{ flex: 1 }}>
          {selected === "General" && <GeneralPanel />}
          {selected === "Layers" && (
            <LayersPanel
              workspace={workspace}
              onUiModeChange={onUiModeChange}
              onVisibilityChange={onVisibilityChange}
            />
          )}
          {selected === "Keyboard" && <KeyboardPanel />}
          {selected === "Backend" && <BackendPanel />}
          {selected === "Workspaces" && (
            <WorkspacesPanel workspace={workspace} onWorkspaceReplace={onWorkspaceReplace} />
          )}
          {selected === "About" && <AboutPanel />}
        </div>
      </div>
    </Modal>
  );
}
