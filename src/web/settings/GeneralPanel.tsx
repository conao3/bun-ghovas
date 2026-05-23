import { Settings } from "lucide-react";
import { Button } from "../components/Button";
import { PanelHeader } from "./PanelHeader";
import { useToast } from "../lib/toast";

export function GeneralPanel() {
  const toast = useToast();

  function handleResetOnboarding() {
    try {
      localStorage.removeItem("ghovas.onboarded");
      localStorage.removeItem("ghovas.tutorialSeen");
      toast.show("success", "Onboarding reset. Reload to see the welcome screen.");
    } catch {
      toast.show("error", "Failed to clear localStorage.");
    }
  }

  return (
    <div>
      <PanelHeader icon={Settings} title="General" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-body-strong font-mono text-[13px]">Startup</span>
          <div>
            <Button variant="secondary" onPress={handleResetOnboarding}>
              Reset onboarding
            </Button>
            <p className="text-muted font-mono text-[11px] mt-1">
              Clears the "onboarded" / "tutorial seen" flags so the welcome screen and the tutorial
              overlay appear on the next load.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
