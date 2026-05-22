import type { WorkspaceState } from "../../shared/types";

export function WorkspacesPanel(props: {
  workspace: WorkspaceState;
  onWorkspaceReplace: (next: WorkspaceState) => void;
}) {
  return (
    <div>
      <h2 style={{ color: "#ccc", fontFamily: "monospace", marginTop: 0 }}>Workspaces</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontSize: 13 }}>Coming soon</p>
    </div>
  );
}
