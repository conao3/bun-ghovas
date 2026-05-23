import { Settings } from "lucide-react";
import { PanelHeader } from "./PanelHeader";

export function GeneralPanel() {
  return (
    <div>
      <PanelHeader icon={Settings} title="General" />
      <p className="font-mono text-[13px] text-on-dark-muted">Coming soon</p>
    </div>
  );
}
