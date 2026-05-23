import { createContext, useContext, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "./components/Modal";
import { Button } from "./components/Button";
import { TextField } from "./components/TextField";
import { parseEnv } from "./lib/parseEnv";
import { loadBackendSettings } from "./lib/backendSettings";
import type { SessionMeta } from "../shared/types";

interface SessionOpts {
  shell?: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface TerminalSessionCtxValue {
  createTerminalWindow: (sessionId: string, opts: SessionOpts) => void;
  sessionOptsMap: Map<string, SessionOpts>;
}

export const TerminalSessionCtx = createContext<TerminalSessionCtxValue | null>(null);

interface SessionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (sessionId: string) => void;
  onCreateNew?: () => void;
  windowTitles: Map<string, string>;
}

export function SessionPicker({
  isOpen,
  onClose,
  onAttach,
  windowTitles,
}: SessionPickerProps) {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [view, setView] = useState<"picker" | "form">("picker");
  const [shell, setShell] = useState("");
  const [cwd, setCwd] = useState("");
  const [envText, setEnvText] = useState("");

  const ctx = useContext(TerminalSessionCtx);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/sessions")
      .then((r) => r.json() as Promise<SessionMeta[]>)
      .then((data) => setSessions(data.filter((s) => s.alive)))
      .catch(() => setSessions([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setView("picker");
  }, [isOpen]);

  const handleNewSession = () => {
    const settings = loadBackendSettings();
    setShell(settings.shell);
    setCwd(settings.cwd);
    setEnvText("");
    setView("form");
  };

  const handleCreate = () => {
    if (!ctx) return;
    const sessionId = crypto.randomUUID().slice(0, 8);
    const parsedEnv = parseEnv(envText);
    ctx.createTerminalWindow(sessionId, {
      shell: shell || undefined,
      cwd: cwd || undefined,
      env: Object.keys(parsedEnv).length > 0 ? parsedEnv : undefined,
    });
    onClose();
    setView("picker");
  };

  const handleCancel = () => {
    setView("picker");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={view === "form" ? "New terminal session" : "Open terminal"}
    >
      {view === "picker" ? (
        <div className="flex flex-col min-w-[260px]">
          <Button
            variant="ghost"
            className="justify-start gap-2 text-sm"
            onPress={handleNewSession}
          >
            <Plus size={16} aria-hidden />
            New session...
          </Button>
          {sessions.length > 0 && <div className="border-t border-white/15 my-1" />}
          {sessions.map((session) => {
            const title = windowTitles.get(session.id);
            return (
              <Button
                key={session.id}
                variant="ghost"
                className="justify-start gap-2 text-sm"
                onPress={() => {
                  onAttach(session.id);
                  onClose();
                }}
              >
                <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" aria-hidden />
                <span className="font-mono">{session.id}</span>
                {title != null && <span className="text-on-dark-muted">({title})</span>}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3 min-w-[300px]">
          <TextField label="Shell" value={shell} onChange={setShell} />
          <TextField label="Working directory" value={cwd} onChange={setCwd} />
          <div className="flex flex-col gap-0.5 font-mono text-[12px]">
            <label className="text-white/50 text-[11px]">Env vars (KEY=value, one per line)</label>
            <textarea
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              rows={4}
              className="bg-black/40 border border-white/15 rounded-[3px] text-on-dark-strong font-mono text-[12px] py-[3px] px-2 outline-none w-full resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onPress={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleCreate}>
              Create
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
