import { useState } from "react";
import { TextField } from "../components/TextField";
import { loadBackendSettings, saveBackendSettings } from "../lib/backendSettings";
import type { BackendSettings } from "../lib/backendSettings";

export function BackendPanel() {
  const [settings, setSettings] = useState<BackendSettings>(loadBackendSettings);

  function update(patch: Partial<BackendSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveBackendSettings(next);
  }

  return (
    <div>
      <h2 className="text-text-muted-light font-mono mt-0">Backend</h2>
      <div className="flex flex-col gap-3">
        <TextField
          label="Default shell"
          value={settings.shell}
          onChange={(v) => update({ shell: v })}
        />
        <TextField label="Default cwd" value={settings.cwd} onChange={(v) => update({ cwd: v })} />
        <TextField
          label="Scrollback limit (MiB)"
          inputMode="numeric"
          value={String(settings.scrollbackMiB)}
          onChange={(v) => {
            const n = parseFloat(v);
            if (!Number.isNaN(n) && n > 0) update({ scrollbackMiB: n });
          }}
        />
      </div>
    </div>
  );
}
