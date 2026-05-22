import type { ServerMessage } from "../src/server/pty";

const PORT = Number(process.env.PORT ?? 3000);
const WS_URL = `ws://localhost:${PORT}/ws`;
const SESSION_ID = `smoke-${Date.now()}`;
const TIMEOUT_MS = 5000;

const observed: ServerMessage[] = [];
let outputAccum = "";
let done = false;

const ws = new WebSocket(WS_URL);

const timeout = setTimeout(() => {
  if (!done) {
    console.error("TIMEOUT: observed", JSON.stringify(observed, null, 2));
    process.exit(1);
  }
}, TIMEOUT_MS);

ws.onopen = () => {
  ws.send(
    JSON.stringify({ type: "open", sessionId: SESSION_ID, cols: 80, rows: 24 }),
  );
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data as string) as ServerMessage;
  observed.push(msg);

  if (msg.type === "open" && msg.sessionId === SESSION_ID) {
    ws.send(JSON.stringify({ type: "input", sessionId: SESSION_ID, data: "echo hello\nexit\n" }));
  } else if (msg.type === "output" && msg.sessionId === SESSION_ID) {
    outputAccum += msg.data;
  } else if (msg.type === "exit" && msg.sessionId === SESSION_ID) {
    done = true;
    clearTimeout(timeout);
    ws.close();

    const hasHello = outputAccum.includes("hello");
    const exitOk = msg.exitCode === 0;

    if (hasHello && exitOk) {
      console.log("OK");
      process.exit(0);
    } else {
      console.error("FAIL");
      console.error("  output:", JSON.stringify(outputAccum));
      console.error("  exitCode:", msg.exitCode);
      process.exit(1);
    }
  } else if (msg.type === "error") {
    done = true;
    clearTimeout(timeout);
    ws.close();
    console.error("ERROR:", msg.message);
    process.exit(1);
  }
};

ws.onerror = (err) => {
  clearTimeout(timeout);
  console.error("WebSocket error:", err);
  process.exit(1);
};
