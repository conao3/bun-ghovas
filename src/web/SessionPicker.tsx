import { createContext, useContext, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "./components/Modal";
import { Button } from "./components/Button";
import { TextField } from "./components/TextField";
import { parseEnv } from "./lib/parseEnv";
import { useToast } from "./lib/toast";
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
  windowTitles: Map<string, string>;
}

export function SessionPicker({ isOpen, onClose, onAttach, windowTitles }: SessionPickerProps) {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [view, setView] = useState<"picker" | "form">("picker");
  const [shell, setShell] = useState("");
  const [cwd, setCwd] = useState("");
  const [envText, setEnvText] = useState("");

  const ctx = useContext(TerminalSessionCtx);
  const toast = useToast();

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
    const invalidLines = envText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "" && !l.includes("="));
    if (invalidLines.length > 0) {
      toast.show("warning", `Invalid env lines (missing =): ${invalidLines.join(", ")}`);
    }
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
      ariaLabelledby="session-picker-title"
    >
      {view === "picker" ? (
        <div className="flex flex-col w-72">
          <h2
            id="session-picker-title"
            className="font-mono text-[11px] text-on-dark-muted px-1 pb-2"
          >
            terminal → session
          </h2>
          <Button
            variant="ghost"
            className="justify-start gap-2 text-sm items-start py-1.5 w-full"
            onPress={handleNewSession}
          >
            <Plus size={16} className="mt-0.5 flex-shrink-0" aria-hidden />
            <span className="flex flex-col items-start">
              <span>New session</span>
              <span className="text-[11px] text-on-dark-muted font-sans font-normal">
                spawn a fresh pty
              </span>
            </span>
          </Button>
          {sessions.length > 0 && (
            <>
              <div className="h-px bg-white/10 my-1" />
              <div className="font-mono text-[11px] text-on-dark-muted px-1 py-1">
                existing sessions
              </div>
              {sessions.map((session) => {
                const title = windowTitles.get(session.id);
                return (
                  <Button
                    key={session.id}
                    variant="ghost"
                    className="justify-start gap-2 text-sm items-start py-1.5 w-full"
                    onPress={() => {
                      onAttach(session.id);
                      onClose();
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center bg-white/8 font-mono text-[10px] text-on-dark-soft flex-shrink-0 mt-0.5"
                      aria-hidden
                    >
                      {session.id.slice(0, 2)}
                    </span>
                    <span className="flex flex-col items-start flex-1 min-w-0">
                      <span className="truncate font-sans font-normal">{title ?? session.id}</span>
                      <span className="text-[11px] text-on-dark-muted font-mono">
                        pty {session.id}
                      </span>
                    </span>
                    <span
                      className="w-2 h-2 rounded-full bg-success flex-shrink-0 mt-1.5"
                      aria-hidden
                    />
                  </Button>
                );
              })}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 min-w-[320px]">
          <h2 id="session-picker-title" className="font-mono text-[11px] text-on-dark-muted">
            new pty session
          </h2>
          <TextField label="Shell" value={shell} onChange={setShell} />
          <TextField label="Working directory" value={cwd} onChange={setCwd} />
          <div className="flex flex-col gap-0.5 font-mono text-[12px]">
            <label className="text-white/50 text-[11px]">
              Env vars <span className="text-white/30">(optional)</span>
            </label>
            <textarea
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              placeholder={"FOO=bar\nKEY=value"}
              rows={4}
              className="bg-black/40 border border-white/15 rounded-[3px] text-on-dark-strong font-mono text-[12px] py-[3px] px-2 outline-none w-full resize-none placeholder:text-white/25"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onPress={handleCreate}>
              Spawn
            </Button>
            <Button variant="secondary" onPress={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
