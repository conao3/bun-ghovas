import { useEffect, useRef, useState } from "react";
import { init, Terminal as GhosttyTerminal, FitAddon } from "ghostty-web";
import { connectPtySession, type PtyHandle } from "../lib/ptyClient";
import { useToast } from "../lib/toast";

const wasmReady: Promise<void> = init();

interface TerminalProps {
  sessionId: string;
  shell?: string;
}

export function Terminal({ sessionId, shell }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState<string | null>(null);
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

        term = new GhosttyTerminal({
          fontSize: 13,
          fontFamily: "monospace",
          theme: {
            background: "#1e1e1e",
            foreground: "#cccccc",
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
  }, [sessionId, shell]);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {overlay && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "4px 8px",
            background: "rgba(0,0,0,0.75)",
            color: "#ff6b6b",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          {overlay}
        </div>
      )}
    </div>
  );
}
