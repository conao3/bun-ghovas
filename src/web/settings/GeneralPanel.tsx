import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "../components/Button";
import { PanelHeader } from "./PanelHeader";
import { useToast } from "../lib/toast";

type StartupMode = "restore-last" | "blank";

const STARTUP_MODE_KEY = "ghovas.startup-mode";

const STARTUP_OPTIONS: { value: StartupMode; label: string }[] = [
  { value: "restore-last", label: "Restore last" },
  { value: "blank", label: "Empty canvas" },
];

function readStartupMode(): StartupMode {
  try {
    const raw = localStorage.getItem(STARTUP_MODE_KEY);
    if (raw === "blank") return "blank";
    return "restore-last";
  } catch {
    return "restore-last";
  }
}

export function GeneralPanel() {
  const toast = useToast();
  const [startupMode, setStartupMode] = useState<StartupMode>(readStartupMode);

  function handleStartupModeChange(mode: StartupMode) {
    try {
      localStorage.setItem(STARTUP_MODE_KEY, mode);
      setStartupMode(mode);
    } catch {
      toast.show("error", "Failed to save startup mode.");
    }
  }

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
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-muted font-mono text-[12px] mb-2">
                What to show when ghovas opens.
              </div>
              <div
                role="radiogroup"
                aria-label="Startup mode"
                className="inline-flex bg-surface-card rounded-md p-[3px] gap-[2px]"
              >
                {STARTUP_OPTIONS.map((opt) => {
                  const isActive = startupMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => handleStartupModeChange(opt.value)}
                      style={{
                        background: isActive ? "var(--color-canvas)" : "transparent",
                        border: 0,
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 500,
                        color: isActive ? "var(--color-ink)" : "var(--color-body)",
                        padding: "6px 14px",
                        borderRadius: 5,
                        cursor: "pointer",
                        boxShadow: isActive ? "0 1px 2px rgba(20,20,19,0.08)" : "none",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
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
    </div>
  );
}
