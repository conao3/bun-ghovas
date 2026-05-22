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
      <h2 style={{ color: "#ccc", fontFamily: "monospace", marginTop: 0 }}>Workspaces</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <Button onPress={handleExport}>Export workspace</Button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div>
            <Button onPress={handleImportClick}>Import workspace</Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
          {importError && (
            <span style={{ color: "#ff6b6b", fontFamily: "monospace", fontSize: 12 }}>
              {importError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
