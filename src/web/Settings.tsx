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
  activeIds: Record<LayerLevel, string>;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
  onWorkspaceReplace: (next: WorkspaceState) => void;
  currentWorkspaceName: string;
  onWorkspaceCurrentChange: (name: string) => void;
}

export function Settings({
  isOpen,
  onClose,
  workspace,
  activeIds,
  onUiModeChange,
  onVisibilityChange,
  onWorkspaceReplace,
  currentWorkspaceName,
  onWorkspaceCurrentChange,
}: SettingsProps) {
  const [selected, setSelected] = useState<NavEntry>("General");

  const handleArrowNav = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = NAV_ENTRIES.indexOf(selected);
    let nextIndex = currentIndex;
    if (e.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % NAV_ENTRIES.length;
    } else if (e.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + NAV_ENTRIES.length) % NAV_ENTRIES.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = NAV_ENTRIES.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const next = NAV_ENTRIES[nextIndex];
    setSelected(next);
    document.getElementById(`settings-tab-${next.toLowerCase()}`)?.focus();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Settings">
      <div className="bg-canvas rounded-md -m-5 p-5 flex gap-0 min-w-[560px] min-h-[360px]">
        <div
          role="tablist"
          aria-label="設定カテゴリ"
          aria-orientation="vertical"
          className="w-[140px] bg-surface-soft border-r border-hairline pr-3 mr-3"
        >
          {NAV_ENTRIES.map((entry) => {
            const Icon = NAV_ICONS[entry];
            return (
              <button
                key={entry}
                role="tab"
                id={`settings-tab-${entry.toLowerCase()}`}
                aria-selected={selected === entry}
                aria-controls={`settings-panel-${entry.toLowerCase()}`}
                tabIndex={selected === entry ? 0 : -1}
                onClick={() => setSelected(entry)}
                onKeyDown={handleArrowNav}
                className={clsx(
                  "flex items-center gap-2 px-[10px] py-[6px] rounded-[3px] cursor-pointer font-mono text-[13px] w-full text-left",
                  selected === entry ? "text-ink bg-surface-card" : "text-muted bg-transparent",
                )}
              >
                <Icon size={14} aria-hidden />
                {entry}
              </button>
            );
          })}
        </div>
        <div
          role="tabpanel"
          id={`settings-panel-${selected.toLowerCase()}`}
          aria-labelledby={`settings-tab-${selected.toLowerCase()}`}
          tabIndex={0}
          className="flex-1 outline-none"
        >
          {selected === "General" && <GeneralPanel />}
          {selected === "Layers" && (
            <LayersPanel
              workspace={workspace}
              activeIds={activeIds}
              onUiModeChange={onUiModeChange}
              onVisibilityChange={onVisibilityChange}
            />
          )}
          {selected === "Keyboard" && <KeyboardPanel />}
          {selected === "Backend" && <BackendPanel />}
          {selected === "Workspaces" && (
            <WorkspacesPanel
              workspace={workspace}
              onWorkspaceReplace={onWorkspaceReplace}
              currentWorkspaceName={currentWorkspaceName}
              onWorkspaceCurrentChange={onWorkspaceCurrentChange}
            />
          )}
          {selected === "About" && <AboutPanel />}
        </div>
      </div>
    </Modal>
  );
}
