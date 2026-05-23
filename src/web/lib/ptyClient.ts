import type { ClientMessage, ServerMessage } from "../../server/pty";

export interface PtyHandle {
  sendInput(data: string): void;
  resize(cols: number, rows: number): void;
  close(): void;
}

export interface ConnectPtySessionOpts {
  sessionId: string;
  cols: number;
  rows: number;
  shell?: string;
  cwd?: string;
  scrollbackMiB?: number;
  onOutput: (data: string) => void;
  onExit: (code: number | null, signal?: string) => void;
  onError: (message: string) => void;
}

export function connectPtySession(opts: ConnectPtySessionOpts): PtyHandle {
  const { sessionId, cols, rows, shell, cwd, scrollbackMiB, onOutput, onExit, onError } = opts;

  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${proto}//${location.host}/ws`);

  function send(msg: ClientMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  ws.addEventListener("open", () => {
    send({
      type: "open",
      sessionId,
      cols,
      rows,
      ...(shell ? { shell } : {}),
      ...(cwd ? { cwd } : {}),
      ...(scrollbackMiB !== undefined ? { scrollbackMiB } : {}),
    });
  });

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data as string) as ServerMessage;
    if (msg.sessionId !== sessionId && msg.type !== "error") return;
    switch (msg.type) {
      case "output":
        onOutput(msg.data);
        break;
      case "exit":
        onExit(msg.exitCode, msg.signal);
        break;
      case "error":
        onError(msg.message);
        break;
    }
  });

  ws.addEventListener("error", () => {
    onError("WebSocket error");
  });

  return {
    sendInput(data) {
      send({ type: "input", sessionId, data });
    },
    resize(c, r) {
      send({ type: "resize", sessionId, cols: c, rows: r });
    },
    close() {
      send({ type: "close", sessionId });
      ws.close();
    },
  };
}
