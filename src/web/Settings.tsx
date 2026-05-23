import { useState } from "react";
import clsx from "clsx";
import {
  Settings as SettingsIcon,
  Layers as LayersIcon,
  Keyboard as KeyboardIcon,
  Server,
  LayoutGrid,
  Info,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
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

const NAV_ICONS: Record<NavEntry, React.ComponentType<LucideProps>> = {
  General: SettingsIcon,
  Layers: LayersIcon,
  Keyboard: KeyboardIcon,
  Backend: Server,
  Workspaces: LayoutGrid,
  About: Info,
};

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
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Settings">
      <div className="bg-canvas rounded-md -m-5 p-5 flex gap-0 min-w-[560px] min-h-[360px]">
        <nav className="w-[140px] bg-surface-soft border-r border-hairline pr-3 mr-3">
          {NAV_ENTRIES.map((entry) => {
            const Icon = NAV_ICONS[entry];
            return (
              <div
                key={entry}
                onClick={() => setSelected(entry)}
                className={clsx(
                  "flex items-center gap-2 px-[10px] py-[6px] rounded-[3px] cursor-pointer font-mono text-[13px]",
                  selected === entry ? "text-ink bg-surface-card" : "text-muted bg-transparent",
                )}
              >
                <Icon size={14} aria-hidden />
                {entry}
              </div>
            );
          })}
        </nav>
        <div className="flex-1">
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
