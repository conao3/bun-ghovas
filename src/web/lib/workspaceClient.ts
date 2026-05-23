import type { WorkspaceState } from "../../shared/types";
import { migrateWorkspace } from "./workspaceMigration";

export async function listWorkspaces(): Promise<{ names: string[]; current: string }> {
  const res = await fetch("/workspaces");
  if (!res.ok) throw new Error(`GET /workspaces failed: ${res.status}`);
  return res.json() as Promise<{ names: string[]; current: string }>;
}

export async function loadWorkspace(name?: string): Promise<WorkspaceState | null> {
  const qs = name ? `?name=${encodeURIComponent(name)}` : "";
  const res = await fetch(`/workspace${qs}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /workspace failed: ${res.status}`);
  const body = (await res.json()) as { workspace: unknown };
  return migrateWorkspace(body.workspace);
}

export async function saveWorkspace(state: WorkspaceState, name?: string): Promise<void> {
  const qs = name ? `?name=${encodeURIComponent(name)}` : "";
  const res = await fetch(`/workspace${qs}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workspace: state }),
  });
  if (!res.ok) throw new Error(`PUT /workspace failed: ${res.status}`);
}

export async function saveWorkspaceAs(name: string, ws: WorkspaceState): Promise<void> {
  const res = await fetch("/workspaces", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, workspace: ws }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `POST /workspaces failed: ${res.status}`);
  }
}

export async function deleteWorkspace(name: string): Promise<void> {
  const res = await fetch(`/workspaces/${encodeURIComponent(name)}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `DELETE /workspaces/${name} failed: ${res.status}`);
  }
}
