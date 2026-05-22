import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { loadWorkspace, saveWorkspace } from "../../src/server/workspaceStore";
import type { WorkspaceState } from "../../src/shared/types";

const STATE_A: WorkspaceState = {
  layers: {
    0: { canvases: [{ id: "c1", windows: [], panX: 0, panY: 0, zoom: 1 }], uiMode: "floating", visible: true },
    1: { canvases: [], uiMode: "horizontal-tabs", visible: false },
    2: { canvases: [], uiMode: "horizontal-tabs", visible: false },
    3: { canvases: [], uiMode: "horizontal-tabs", visible: false },
  },
};

const STATE_B: WorkspaceState = {
  layers: {
    0: { canvases: [{ id: "c2", windows: [], panX: 10, panY: 20, zoom: 2 }], uiMode: "horizontal-tabs", visible: true },
    1: { canvases: [], uiMode: "floating", visible: false },
    2: { canvases: [], uiMode: "horizontal-tabs", visible: false },
    3: { canvases: [], uiMode: "horizontal-tabs", visible: false },
  },
};

let originalCwd: string;

beforeEach(async () => {
  originalCwd = process.cwd();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ghovas-store-"));
  process.chdir(tmpDir);
});

afterEach(async () => {
  const tmpDir = process.cwd();
  process.chdir(originalCwd);
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("workspaceStore", () => {
  it("returns null when data/workspace.json does not exist", async () => {
    const result = await loadWorkspace();
    expect(result).toBeNull();
  });

  it("saves and loads state with deep equality", async () => {
    await saveWorkspace(STATE_A);
    const result = await loadWorkspace();
    expect(result).toEqual(STATE_A);
  });

  it("overwrites with second save", async () => {
    await saveWorkspace(STATE_A);
    await saveWorkspace(STATE_B);
    const result = await loadWorkspace();
    expect(result).toEqual(STATE_B);
  });

  it("throws on malformed JSON", async () => {
    await fs.mkdir("data", { recursive: true });
    await fs.writeFile("data/workspace.json", "not json");
    await expect(loadWorkspace()).rejects.toThrow();
  });
});
