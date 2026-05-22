import { useRef, useState } from "react";
import { Button } from "../components/Button";
import type { WorkspaceState } from "../../shared/types";

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
      <h2 className="text-text-muted-light font-mono mt-0">Workspaces</h2>
      <div className="flex flex-col gap-3">
        <div>
          <Button onPress={handleExport}>Export workspace</Button>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            <Button onPress={handleImportClick}>Import workspace</Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {importError && (
            <span className="text-danger-light font-mono text-[12px]">
              {importError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
