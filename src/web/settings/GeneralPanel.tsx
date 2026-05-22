import { useState } from "react";
import { RadioGroup, Radio } from "../components/RadioGroup";
import { getStoredTheme, setTheme } from "../lib/theme";
import type { Theme } from "../lib/theme";

export function GeneralPanel() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  function handleChange(value: string) {
    const t = value as Theme;
    setTheme(t);
    setThemeState(t);
  }

  return (
    <div>
      <h2 className="text-text-muted-light font-mono mt-0">General</h2>
      <div className="flex items-center gap-4 font-mono text-[13px]">
        <span className="text-text-muted">Theme</span>
        <RadioGroup value={theme} onChange={handleChange} aria-label="Theme">
          <Radio value="dark">Dark</Radio>
          <Radio value="light">Light</Radio>
        </RadioGroup>
      </div>
    </div>
  );
}
