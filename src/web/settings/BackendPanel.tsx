import { useState } from "react";
import { Server } from "lucide-react";
import { TextField } from "../components/TextField";
import { loadBackendSettings, saveBackendSettings } from "../lib/backendSettings";
import type { BackendSettings } from "../lib/backendSettings";
import { PanelHeader } from "./PanelHeader";

export function BackendPanel() {
  const [settings, setSettings] = useState<BackendSettings>(loadBackendSettings);

  function update(patch: Partial<BackendSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveBackendSettings(next);
  }

  return (
    <div>
      <PanelHeader icon={Server} title="Backend" />
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="text-body-strong font-mono text-[13px] mt-0 mb-3">Shell</h3>
          <div className="flex flex-col gap-3">
            <TextField
              label="Default shell"
              value={settings.shell}
              onChange={(v) => update({ shell: v })}
            />
            <TextField label="Default cwd" value={settings.cwd} onChange={(v) => update({ cwd: v })} />
          </div>
        </section>
        <section>
          <h3 className="text-body-strong font-mono text-[13px] mt-0 mb-3">Output</h3>
          <TextField
            label="Scrollback limit (MiB)"
            inputMode="numeric"
            value={String(settings.scrollbackMiB)}
            onChange={(v) => {
              const n = parseFloat(v);
              if (!Number.isNaN(n) && n > 0) update({ scrollbackMiB: n });
            }}
          />
        </section>
      </div>
    </div>
  );
}
