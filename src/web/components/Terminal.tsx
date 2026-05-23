import { useEffect, useRef, useState } from "react";
import { init, Terminal as GhosttyTerminal, FitAddon } from "ghostty-web";
import { connectPtySession, type PtyHandle } from "../lib/ptyClient";
import { useToast } from "../lib/toast";
import { Button } from "./Button";

const wasmReady: Promise<void> = init();

interface TerminalProps {
  sessionId: string;
  shell?: string;
  cwd?: string;
  scrollbackMiB?: number;
}

export function Terminal({ sessionId, shell, cwd, scrollbackMiB }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);
  const toast = useToast();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    let term: GhosttyTerminal | null = null;
    let handle: PtyHandle | null = null;

    wasmReady
      .then(() => {
        if (disposed) return;
        setOverlay(null);

        const rootStyle = getComputedStyle(document.documentElement);
        term = new GhosttyTerminal({
          fontSize: 13,
          fontFamily: "monospace",
          theme: {
            background: rootStyle.getPropertyValue("--color-surface").trim(),
            foreground: rootStyle.getPropertyValue("--color-text-muted-light").trim(),
          },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(el);
        fitAddon.fit();

        const dims = fitAddon.proposeDimensions();
        const cols = dims?.cols ?? 80;
        const rows = dims?.rows ?? 24;

        handle = connectPtySession({
          sessionId,
          cols,
          rows,
          shell,
          cwd,
          scrollbackMiB,
          onOutput: (data) => term?.write(data),
          onExit: (code, signal) => {
            const msg = signal ? `exited (signal ${signal})` : `exited (code ${code ?? "?"})`;
            setOverlay(msg);
            if (signal || (typeof code === "number" && code !== 0)) {
              toast.show("error", `terminal ${sessionId}: ${msg}`);
            }
          },
          onError: (message) => {
            setOverlay(`error: ${message}`);
            toast.show("error", `terminal ${sessionId}: error: ${message}`);
          },
        });

        term.onData((data) => handle?.sendInput(data));
        term.onResize(({ cols: c, rows: r }) => handle?.resize(c, r));
        fitAddon.observeResize();
      })
      .catch((err: unknown) => {
        setOverlay(`init error: ${String(err)}`);
      });

    return () => {
      disposed = true;
      handle?.close();
      term?.dispose();
    };
  }, [sessionId, shell, cwd, scrollbackMiB, reconnectKey]);

  const showReconnect = overlay !== null && !overlay.startsWith("init error:") && overlay !== "Reconnecting...";

  return (
    <div
      className="relative w-full h-full"
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div ref={containerRef} className="w-full h-full" />
      {overlay && (
        <div className="absolute bottom-0 left-0 right-0 py-1 px-2 bg-black/75 text-danger-light font-mono text-[12px] flex items-center gap-2">
          <span>{overlay}</span>
          {showReconnect && (
            <Button
              variant="secondary"
              onPress={() => {
                setOverlay("Reconnecting...");
                setReconnectKey((k) => k + 1);
              }}
            >
              Reconnect
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
