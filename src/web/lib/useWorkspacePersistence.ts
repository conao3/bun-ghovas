import { useEffect, useRef } from "react";
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

export function useWorkspacePersistence(
  workspace: WorkspaceState,
  setWorkspace: (next: WorkspaceState) => void,
) {
  const hydratedRef = useRef(false);
  const toast = useToast();

  useEffect(() => {
    if (readStartupMode() === "blank") {
      setWorkspace(INITIAL_WORKSPACE);
      hydratedRef.current = true;
      return;
    }

    loadWorkspace()
      .then((loaded) => {
        if (loaded !== null) setWorkspace(loaded);
        hydratedRef.current = true;
      })
      .catch((err) => {
        console.warn("Failed to load workspace:", err);
        toast.show("warning", "workspace load failed: " + err.message);
        hydratedRef.current = true;
      });
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const timer = setTimeout(() => {
      saveWorkspace(workspace).catch((err) => {
        console.warn("Failed to save workspace:", err);
        toast.show("error", "workspace save failed: " + err.message);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [workspace]);
}
