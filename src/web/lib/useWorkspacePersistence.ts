import { useEffect, useRef, useState } from "react";
import type { WorkspaceState } from "../../shared/types";
import { INITIAL_WORKSPACE } from "../App";
import { loadWorkspace, saveWorkspace } from "./workspaceClient";
import { useToast } from "./toast";

function readStartupMode(): "restore-last" | "blank" {
  try {
    const raw = localStorage.getItem("ghovas.startup-mode");
    if (raw === "blank") return "blank";
    return "restore-last";
  } catch {
    return "restore-last";
  }
}

const CURRENT_KEY = "ghovas.workspace-current";

export function getCurrentWorkspaceName(): string {
  return localStorage.getItem(CURRENT_KEY) ?? "default";
}

export function setCurrentWorkspaceName(name: string): void {
  localStorage.setItem(CURRENT_KEY, name);
}

export function useWorkspacePersistence(
  workspace: WorkspaceState,
  setWorkspace: (next: WorkspaceState) => void,
) {
  const hydratedRef = useRef(false);
  const toast = useToast();
  const [currentName, setCurrentName] = useState<string>(() => getCurrentWorkspaceName());

  useEffect(() => {
    if (readStartupMode() === "blank") {
      setWorkspace(INITIAL_WORKSPACE);
      hydratedRef.current = true;
      return;
    }

    loadWorkspace(currentName)
      .then((loaded) => {
        if (loaded !== null) setWorkspace(loaded);
        hydratedRef.current = true;
      })
      .catch((err) => {
        console.warn("Failed to load workspace:", err);
        toast.show("warning", "workspace load failed: " + (err as Error).message);
        hydratedRef.current = true;
      });
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const timer = setTimeout(() => {
      saveWorkspace(workspace, currentName).catch((err) => {
        console.warn("Failed to save workspace:", err);
        toast.show("error", "workspace save failed: " + (err as Error).message);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [workspace, currentName]);

  function switchCurrent(name: string) {
    setCurrentWorkspaceName(name);
    setCurrentName(name);
  }

  return { currentName, switchCurrent };
}
