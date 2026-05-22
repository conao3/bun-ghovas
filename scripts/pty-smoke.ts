import type { ServerMessage } from "../src/server/pty";

const PORT = Number(process.env.PORT ?? 3000);
const WS_URL = `ws://localhost:${PORT}/ws`;
const SESSION_ID = `smoke-${Date.now()}`;
const TIMEOUT_MS = 15000;

function openWs(): WebSocket {
  return new WebSocket(WS_URL);
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      if (msg.type === "open" && msg.sessionId === SESSION_ID) {
        resolve();
      } else if (msg.type === "error") {
        reject(new Error(`server error: ${msg.message}`));
      } else if (msg.type === "exit") {
        reject(new Error(`unexpected exit code=${msg.exitCode}`));
      }
    };
    ws.onerror = (err) => reject(new Error(`ws error: ${String(err)}`));
  });
}

function collectUntilText(ws: WebSocket, needle: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let accum = "";
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      if (msg.type === "output" && msg.sessionId === SESSION_ID) {
        accum += msg.data;
        if (accum.includes(needle)) resolve();
      } else if (msg.type === "error") {
        reject(new Error(`server error: ${msg.message}`));
      } else if (msg.type === "exit") {
        reject(new Error(`unexpected exit code=${msg.exitCode}`));
      }
    };
    ws.onerror = (err) => reject(new Error(`ws error: ${String(err)}`));
  });
}

function collectReplay(ws: WebSocket, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let accum = "";
    const timer = setTimeout(() => resolve(accum), timeoutMs);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      if (msg.type === "output" && msg.sessionId === SESSION_ID) {
        accum += msg.data;
      } else if (msg.type === "error") {
        clearTimeout(timer);
        reject(new Error(`server error: ${msg.message}`));
      }
    };
    ws.onerror = (err) => {
      clearTimeout(timer);
      reject(new Error(`ws error: ${String(err)}`));
    };
  });
}

const globalTimeout = setTimeout(() => {
  console.error("TIMEOUT");
  process.exit(1);
}, TIMEOUT_MS);

async function main() {
  const ws1 = openWs();
  await new Promise<void>((resolve, reject) => {
    ws1.onopen = () => resolve();
    ws1.onerror = (err) => reject(new Error(`ws1 connect error: ${String(err)}`));
  });

  ws1.send(JSON.stringify({ type: "open", sessionId: SESSION_ID, cols: 80, rows: 24 }));
  await waitForOpen(ws1);

  const firstPromise = collectUntilText(ws1, "first");
  ws1.send(
    JSON.stringify({
      type: "input",
      sessionId: SESSION_ID,
      data: "bash -c 'echo first; sleep 0.5; echo second; sleep 5'\n",
    }),
  );
  await firstPromise;

  ws1.close();

  await waitMs(1200);

  const ws2 = openWs();
  await new Promise<void>((resolve, reject) => {
    ws2.onopen = () => resolve();
    ws2.onerror = (err) => reject(new Error(`ws2 connect error: ${String(err)}`));
  });

  const replayPromise = collectReplay(ws2, 2500);
  ws2.send(JSON.stringify({ type: "open", sessionId: SESSION_ID, cols: 80, rows: 24 }));

  const replayData = await replayPromise;

  ws2.send(JSON.stringify({ type: "close", sessionId: SESSION_ID }));
  ws2.close();

  clearTimeout(globalTimeout);

  const hasFirst = replayData.includes("first");
  const hasSecond = replayData.includes("second");

  if (hasFirst && hasSecond) {
    console.log("OK");
    process.exit(0);
  } else {
    console.error("FAIL");
    console.error("  replay:", JSON.stringify(replayData));
    console.error("  hasFirst:", hasFirst, "hasSecond:", hasSecond);
    process.exit(1);
  }
}

main().catch((err) => {
  clearTimeout(globalTimeout);
  console.error("ERROR:", err);
  process.exit(1);
});
