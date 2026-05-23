import { useEffect, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { TextField } from "../components/TextField";
import type { WorkspaceState } from "../../shared/types";
import { INITIAL_WORKSPACE } from "../App";
import { PanelHeader } from "./PanelHeader";
import { listWorkspaces, loadWorkspace, saveWorkspaceAs, deleteWorkspace } from "../lib/workspaceClient";
import { useToast } from "../lib/toast";

const NAME_RE = /^[a-zA-Z0-9_-]+$/;

function timestampForFilename(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function WorkspacesPanel(props: {
  workspace: WorkspaceState;
  onWorkspaceReplace: (next: WorkspaceState) => void;
  currentWorkspaceName: string;
  onWorkspaceCurrentChange: (name: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [saveAsError, setSaveAsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function refreshList() {
    try {
      const result = await listWorkspaces();
      setNames(result.names);
    } catch (err) {
      console.warn("Failed to list workspaces:", err);
    }
  }

  useEffect(() => {
    void refreshList();
  }, []);

  function handleExport() {
    const json = JSON.stringify(props.workspace, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghovas-workspace-${timestampForFilename(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleReset() {
    if (window.confirm("This resets the current workspace to the default layout. Continue?")) {
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

  async function handleLoad(name: string) {
    try {
      const ws = await loadWorkspace(name);
      if (ws === null) {
        toast.show("warning", `workspace '${name}' not found`);
        return;
      }
      props.onWorkspaceReplace(ws);
      props.onWorkspaceCurrentChange(name);
      toast.show("success", `loaded workspace '${name}'`);
    } catch (err) {
      toast.show("error", `load failed: ${(err as Error).message}`);
    }
  }

  async function handleDelete(name: string) {
    if (!window.confirm(`Delete workspace '${name}'? This cannot be undone.`)) return;
    try {
      await deleteWorkspace(name);
      if (props.currentWorkspaceName === name) {
        props.onWorkspaceCurrentChange("default");
        const ws = await loadWorkspace("default");
        if (ws !== null) props.onWorkspaceReplace(ws);
      }
      toast.show("success", `deleted workspace '${name}'`);
      await refreshList();
    } catch (err) {
      toast.show("error", `delete failed: ${(err as Error).message}`);
    }
  }

  function handleSaveAsOpen() {
    setSaveAsName("");
    setSaveAsError(null);
    setSaveAsOpen(true);
  }

  async function handleSaveAsSubmit() {
    const name = saveAsName.trim();
    if (!NAME_RE.test(name)) {
      setSaveAsError("Name must match [a-zA-Z0-9_-]+");
      return;
    }
    setSaving(true);
    setSaveAsError(null);
    try {
      await saveWorkspaceAs(name, props.workspace);
      setSaveAsOpen(false);
      props.onWorkspaceCurrentChange(name);
      toast.show("success", `saved as '${name}'`);
      await refreshList();
    } catch (err) {
      setSaveAsError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PanelHeader icon={LayoutGrid} title="Workspaces" />
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] text-white/50 uppercase tracking-wide">Saved workspaces</span>
            <Button onPress={handleSaveAsOpen} className="!bg-surface-card !text-body-strong !border-hairline text-[12px]">
              Save as...
            </Button>
          </div>
          <table className="w-full font-mono text-[12px]">
            <tbody>
              {names.map((name) => {
                const isCurrent = name === props.currentWorkspaceName;
                return (
                  <tr key={name} className="border-b border-white/8 last:border-0">
                    <td className="py-1.5 pr-2">
                      {isCurrent ? (
                        <span className="font-bold text-on-dark-strong">• {name}</span>
                      ) : (
                        <span className="text-on-dark-muted">{name}</span>
                      )}
                    </td>
                    <td className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onPress={() => void handleLoad(name)}
                          className="!bg-surface-card !text-body-strong !border-hairline !py-0.5 !px-2 text-[11px]"
                        >
                          Load
                        </Button>
                        <Button
                          onPress={() => void handleDelete(name)}
                          isDisabled={name === "default"}
                          className="!bg-surface-card !text-body-strong !border-hairline !py-0.5 !px-2 text-[11px]"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-white/8">
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

      <Modal isOpen={saveAsOpen} onClose={() => setSaveAsOpen(false)} ariaLabel="Save workspace as">
        <div className="flex flex-col gap-4">
          <h3 className="font-mono text-[14px] font-semibold text-on-dark-strong">Save workspace as</h3>
          <TextField
            label="Name (a-z, 0-9, _, -)"
            value={saveAsName}
            onChange={setSaveAsName}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSaveAsSubmit();
              if (e.key === "Escape") setSaveAsOpen(false);
            }}
          />
          {saveAsError && <span className="font-mono text-[12px] text-error">{saveAsError}</span>}
          <div className="flex justify-end gap-2">
            <Button onPress={() => setSaveAsOpen(false)} variant="secondary">Cancel</Button>
            <Button onPress={() => void handleSaveAsSubmit()} isDisabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
