import type { WorkspaceState } from "../../shared/types";
import { migrateWorkspace } from "./workspaceMigration";

export async function loadWorkspace(): Promise<WorkspaceState | null> {
  const res = await fetch("/workspace");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /workspace failed: ${res.status}`);
  const body = (await res.json()) as { workspace: unknown };
  return migrateWorkspace(body.workspace);
}

export async function saveWorkspace(state: WorkspaceState): Promise<void> {
  const res = await fetch("/workspace", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workspace: state }),
  });
  if (!res.ok) throw new Error(`PUT /workspace failed: ${res.status}`);
}
