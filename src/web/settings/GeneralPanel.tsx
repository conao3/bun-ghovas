import { useState } from "react";
import { Settings } from "lucide-react";
import { RadioGroup, Radio } from "../components/RadioGroup";
import { getStoredTheme, setTheme } from "../lib/theme";
import type { Theme } from "../lib/theme";
import { PanelHeader } from "./PanelHeader";

export function GeneralPanel() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  function handleChange(value: string) {
    const t = value as Theme;
    setTheme(t);
    setThemeState(t);
  }

  return (
    <div>
      <PanelHeader icon={Settings} title="General" />
      <div className="flex items-center gap-4 font-mono text-[13px]">
        <span className="text-on-dark-soft">Theme</span>
        <RadioGroup value={theme} onChange={handleChange} aria-label="Theme">
          <Radio value="dark">Dark</Radio>
          <Radio value="light">Light</Radio>
        </RadioGroup>
      </div>
    </div>
  );
}
