import fs from "node:fs/promises";
import type { WorkspaceState } from "../shared/types";

const DATA_DIR = "data";
const WORKSPACE_PATH = `${DATA_DIR}/workspace.json`;
const WORKSPACE_TMP_PATH = `${WORKSPACE_PATH}.tmp`;

export async function loadWorkspace(): Promise<WorkspaceState | null> {
  try {
    const text = await Bun.file(WORKSPACE_PATH).text();
    return JSON.parse(text) as WorkspaceState;
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

export async function saveWorkspace(state: WorkspaceState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await Bun.write(WORKSPACE_TMP_PATH, JSON.stringify(state));
  await fs.rename(WORKSPACE_TMP_PATH, WORKSPACE_PATH);
}
