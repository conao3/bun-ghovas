import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { type RingBuffer, createRingBuffer } from "./ringBuffer.js";

const req = createRequire(import.meta.url);

// Use node-pty's native module directly to work around Bun's tty.ReadStream EAGAIN issue.
// In Bun, tty.ReadStream closes itself on EAGAIN, causing SIGHUP to the child shell.
// Direct fs.readSync polling correctly retries on EAGAIN without closing the fd.
const { loadNativeModule } = req("node-pty/lib/utils") as {
  loadNativeModule: (name: string) => { module: NativePty; dir: string };
};
const native = loadNativeModule("pty");
const ptyNative = native.module;
const helperPath = path.resolve(native.dir, "spawn-helper");

const SCROLLBACK_CAP_BYTES = 1024 * 1024;

interface NativePty {
  fork(
    file: string,
    args: string[],
    env: string[],
    cwd: string,
    cols: number,
    rows: number,
    uid: number,
    gid: number,
    utf8: boolean,
    helperPath: string,
    onExit: (code: number, signal: number) => void,
  ): { fd: number; pid: number; pty: string };
  resize(fd: number, cols: number, rows: number): void;
}

export type ClientMessage =
  | { type: "open"; sessionId: string; shell?: string; cols: number; rows: number }
  | { type: "input"; sessionId: string; data: string }
  | { type: "resize"; sessionId: string; cols: number; rows: number }
  | { type: "close"; sessionId: string };

export type ServerMessage =
  | { type: "open"; sessionId: string }
  | { type: "error"; sessionId?: string; message: string }
  | { type: "output"; sessionId: string; data: string }
  | { type: "exit"; sessionId: string; exitCode: number | null; signal?: string };

interface WsSend {
  send(data: string): void;
}

const nullWs: WsSend = { send: () => {} };

interface Session {
  fd: number;
  pid: number;
  ws: WsSend;
  alive: boolean;
  scrollback: RingBuffer;
}

function buildEnv(extra: Partial<Record<string, string>> = {}): string[] {
  return Object.entries({ ...process.env, ...extra }).map(([k, v]) => `${k}=${v ?? ""}`);
}

async function pollRead(session: Session, sessionId: string, onData: (data: string) => void): Promise<void> {
  const buf = Buffer.allocUnsafe(65536);
  while (session.alive) {
    try {
      const n = fs.readSync(session.fd, buf, 0, buf.length, null);
      if (n > 0) {
        onData(buf.subarray(0, n).toString("utf8"));
      }
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === "EAGAIN" || err.code === "EWOULDBLOCK") {
        await new Promise<void>((r) => setTimeout(r, 8));
      } else {
        break;
      }
    }
  }
}

export function createPtyManager() {
  const sessions = new Map<string, Session>();

  function send(ws: WsSend, msg: ServerMessage) {
    ws.send(JSON.stringify(msg));
  }

  function openSession(ws: WsSend, msg: Extract<ClientMessage, { type: "open" }>) {
    const { sessionId, shell, cols, rows } = msg;

    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      session.ws = ws;
      send(ws, { type: "open", sessionId });
      if (session.scrollback.byteLength() > 0) {
        const data = Buffer.concat(session.scrollback.snapshot()).toString("utf8");
        send(ws, { type: "output", sessionId, data });
      }
      return;
    }

    const shellPath = shell ?? process.env.SHELL ?? "/bin/sh";

    try {
      const result = ptyNative.fork(
        shellPath,
        [],
        buildEnv({ TERM: "xterm-256color" }),
        process.cwd(),
        cols,
        rows,
        -1,
        -1,
        true,
        helperPath,
        (code: number, signal: number) => {
          const s = sessions.get(sessionId);
          if (s) {
            s.alive = false;
            try { fs.closeSync(s.fd); } catch {}
            send(s.ws, {
              type: "exit",
              sessionId,
              exitCode: code,
              signal: signal !== 0 ? String(signal) : undefined,
            });
            sessions.delete(sessionId);
          }
        },
      );

      const session: Session = { fd: result.fd, pid: result.pid, ws, alive: true, scrollback: createRingBuffer(SCROLLBACK_CAP_BYTES) };
      sessions.set(sessionId, session);

      pollRead(session, sessionId, (data) => {
        const s = sessions.get(sessionId);
        if (s) {
          s.scrollback.append(Buffer.from(data, "utf8"));
          send(s.ws, { type: "output", sessionId, data });
        }
      });

      send(ws, { type: "open", sessionId });
    } catch (err) {
      send(ws, { type: "error", sessionId, message: String(err) });
    }
  }

  function handleMessage(ws: WsSend, raw: string | Buffer) {
    const text = typeof raw === "string" ? raw : raw.toString("utf8");
    let msg: ClientMessage;
    try {
      msg = JSON.parse(text) as ClientMessage;
    } catch {
      send(ws, { type: "error", message: "invalid JSON" });
      return;
    }

    switch (msg.type) {
      case "open":
        openSession(ws, msg);
        break;
      case "input": {
        const s = sessions.get(msg.sessionId);
        if (s?.alive) {
          const buf = Buffer.from(msg.data, "utf8");
          try { fs.writeSync(s.fd, buf, 0, buf.length, null); } catch {}
        }
        break;
      }
      case "resize": {
        const s = sessions.get(msg.sessionId);
        if (s?.alive) {
          try { ptyNative.resize(s.fd, msg.cols, msg.rows); } catch {}
        }
        break;
      }
      case "close": {
        const s = sessions.get(msg.sessionId);
        if (s) {
          s.alive = false;
          s.scrollback.clear();
          try { process.kill(s.pid, "SIGHUP"); } catch {}
          sessions.delete(msg.sessionId);
        }
        break;
      }
    }
  }

  function cleanup(ws: WsSend) {
    for (const session of sessions.values()) {
      if (session.ws === ws) {
        session.ws = nullWs;
      }
    }
  }

  return { handleMessage, cleanup };
}
