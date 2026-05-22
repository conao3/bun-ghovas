import { useEffect, useRef } from "react";
import type { WorkspaceState } from "../../shared/types";
import { loadWorkspace, saveWorkspace } from "./workspaceClient";
import { useToast } from "./toast";

export function useWorkspacePersistence(
  workspace: WorkspaceState,
  setWorkspace: (next: WorkspaceState) => void,
) {
  const hydratedRef = useRef(false);
  const toast = useToast();

  useEffect(() => {
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
