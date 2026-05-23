import { useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Button } from "../components/Button";
import type { WorkspaceState } from "../../shared/types";
import { INITIAL_WORKSPACE } from "../App";
import { PanelHeader } from "./PanelHeader";

export function WorkspacesPanel(props: {
  workspace: WorkspaceState;
  onWorkspaceReplace: (next: WorkspaceState) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleExport() {
    const json = JSON.stringify(props.workspace, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleReset() {
    if (window.confirm("This resets all layers and windows to the default workspace. Continue?")) {
      props.onWorkspaceReplace(INITIAL_WORKSPACE);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as WorkspaceState;
        setImportError(null);
        props.onWorkspaceReplace(parsed);
      } catch {
        setImportError("Invalid JSON: could not parse workspace file.");
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read file.");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div>
      <PanelHeader icon={LayoutGrid} title="Workspaces" />
      <div className="flex flex-col gap-3">
        <div>
          <Button
            onPress={handleExport}
            className="!bg-surface-card !text-body-strong !border-hairline"
          >
            Export workspace
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            <Button
              onPress={handleImportClick}
              className="!bg-surface-card !text-body-strong !border-hairline"
            >
              Import workspace
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {importError && <span className="text-error font-mono text-[12px]">{importError}</span>}
        </div>
        <div>
          <Button
            variant="secondary"
            onPress={handleReset}
            className="!bg-surface-card !text-body-strong !border-hairline"
          >
            Reset to default
          </Button>
        </div>
      </div>
    </div>
  );
}
