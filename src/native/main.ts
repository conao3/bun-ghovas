import Electrobun, { BrowserWindow } from "electrobun/bun";

const serverPath = new URL("../server/index.ts", import.meta.url).pathname;

const serverProcess = Bun.spawn(["bun", "run", serverPath], {
  env: { ...process.env, PORT: "0" },
  stdout: "pipe",
  stderr: "inherit",
});

const port = await extractServerPort(serverProcess.stdout);

console.log(`[native] ghovas server on port ${port}`);

new BrowserWindow({
  title: "ghovas",
  url: `http://127.0.0.1:${port}`,
  frame: { width: 1280, height: 800, x: 100, y: 100 },
  sandbox: true,
});

Electrobun.events.on("close", () => {
  serverProcess.kill();
});

async function extractServerPort(stream: ReadableStream<Uint8Array>): Promise<number> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      throw new Error("Server exited before port was reported");
    }
    buffer += decoder.decode(value, { stream: true });
    const match = buffer.match(/listening on http:\/\/localhost:(\d+)/);
    if (match) {
      reader.releaseLock();
      return Number(match[1]);
    }
  }
}
