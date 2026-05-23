import fs from "node:fs/promises";
import type { WorkspaceState } from "../shared/types";

const DATA_DIR = "data";
const WORKSPACES_DIR = `${DATA_DIR}/workspaces`;
const LEGACY_WORKSPACE_PATH = `${DATA_DIR}/workspace.json`;

const NAME_RE = /^[a-zA-Z0-9_-]+$/;

function validateName(name: string): void {
  if (!NAME_RE.test(name)) {
    throw Object.assign(new Error(`invalid workspace name: ${name}`), { code: "INVALID_NAME" });
  }
}

function workspacePath(name: string): string {
  return `${WORKSPACES_DIR}/${name}.json`;
}

export async function migrateFromLegacy(): Promise<void> {
  try {
    await fs.access(LEGACY_WORKSPACE_PATH);
  } catch {
    return;
  }
  await fs.mkdir(WORKSPACES_DIR, { recursive: true });
  const defaultPath = workspacePath("default");
  try {
    await fs.access(defaultPath);
    await fs.unlink(LEGACY_WORKSPACE_PATH);
    return;
  } catch {
    // default.json doesn't exist yet, proceed with rename
  }
  await fs.rename(LEGACY_WORKSPACE_PATH, defaultPath);
}

export async function listWorkspaceNames(): Promise<string[]> {
  await fs.mkdir(WORKSPACES_DIR, { recursive: true });
  const entries = await fs.readdir(WORKSPACES_DIR);
  const names = entries
    .filter((e) => e.endsWith(".json"))
    .map((e) => e.slice(0, -5))
    .filter((n) => NAME_RE.test(n))
    .sort();
  if (!names.includes("default")) names.unshift("default");
  return names;
}

export async function loadNamedWorkspace(name: string): Promise<WorkspaceState | null> {
  validateName(name);
  try {
    const text = await Bun.file(workspacePath(name)).text();
    return JSON.parse(text) as WorkspaceState;
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

export async function saveNamedWorkspace(name: string, state: WorkspaceState): Promise<void> {
  validateName(name);
  await fs.mkdir(WORKSPACES_DIR, { recursive: true });
  const tmp = `${workspacePath(name)}.tmp`;
  await Bun.write(tmp, JSON.stringify(state));
  await fs.rename(tmp, workspacePath(name));
}

export async function workspaceExists(name: string): Promise<boolean> {
  validateName(name);
  try {
    await fs.access(workspacePath(name));
    return true;
  } catch {
    return false;
  }
}

export async function deleteNamedWorkspace(name: string): Promise<void> {
  validateName(name);
  await fs.unlink(workspacePath(name));
}

export async function loadWorkspace(): Promise<WorkspaceState | null> {
  return loadNamedWorkspace("default");
}

export async function saveWorkspace(state: WorkspaceState): Promise<void> {
  return saveNamedWorkspace("default", state);
}
