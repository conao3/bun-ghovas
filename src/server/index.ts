import tailwind from "bun-plugin-tailwind";
import { watch } from "fs";
import { createPtyManager } from "./pty";
import { loadWorkspace, saveWorkspace } from "./workspaceStore";
import type { WorkspaceState } from "../shared/types";

const PORT = Number(process.env.PORT ?? 3000);

const { version } = await Bun.file(new URL("../../package.json", import.meta.url)).json();
const startedAt = Date.now();

const indexHtmlPath = new URL("../web/index.html", import.meta.url);
const indexHtml = await Bun.file(indexHtmlPath).text();

async function buildBundle(): Promise<{ js: string; css: string } | null> {
  const result = await Bun.build({
    entrypoints: [
      new URL("../web/main.tsx", import.meta.url).pathname,
      new URL("../web/index.css", import.meta.url).pathname,
    ],
    target: "browser",
    plugins: [tailwind],
  });
  if (!result.success) {
    for (const msg of result.logs) console.error("BUILD_FAILED:", msg);
    return null;
  }
  return {
    js: await result.outputs.find((o) => o.path.endsWith(".js"))!.text(),
    css: await result.outputs.find((o) => o.path.endsWith(".css"))!.text(),
  };
}

const initialBuild = await buildBundle();
if (initialBuild === null) process.exit(1);
let mainJs = initialBuild.js;
let mainCss = initialBuild.css;

const sseClients = new Set<WritableStreamDefaultWriter<Uint8Array>>();

let rebuildTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRebuild() {
  if (rebuildTimer !== null) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(async () => {
    rebuildTimer = null;
    const result = await buildBundle();
    if (result === null) {
      console.error("BUILD_FAILED: keeping previous bundle");
      return;
    }
    mainJs = result.js;
    mainCss = result.css;
    console.log("bundle rebuilt");
    const msg = new TextEncoder().encode("data: rebuild\n\n");
    for (const writer of sseClients) {
      writer.write(msg).catch(() => {
        sseClients.delete(writer);
      });
    }
  }, 100);
}

for (const dir of [
  new URL("../web", import.meta.url).pathname,
  new URL("../shared", import.meta.url).pathname,
]) {
  watch(dir, { recursive: true }, scheduleRebuild);
}
watch(new URL("../../package.json", import.meta.url).pathname, scheduleRebuild);

const ptyManager = createPtyManager();
console.log("node-pty native module loaded successfully");

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/dev-events") {
      const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
      const writer = writable.getWriter();
      sseClients.add(writer);
      req.signal.addEventListener("abort", () => {
        sseClients.delete(writer);
        writer.close().catch(() => {});
      });
      return new Response(readable, {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
        },
      });
    }
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", version, uptimeMs: Date.now() - startedAt });
    }
    if (url.pathname === "/ws") {
      if (server.upgrade(req)) return undefined;
      return new Response("upgrade failed", { status: 400 });
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(indexHtml, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (url.pathname === "/main.js") {
      return new Response(mainJs, {
        headers: { "content-type": "text/javascript; charset=utf-8" },
      });
    }
    if (url.pathname === "/main.css") {
      return new Response(mainCss, {
        headers: { "content-type": "text/css; charset=utf-8" },
      });
    }
    if (url.pathname === "/workspace" && req.method === "GET") {
      const workspace = await loadWorkspace();
      if (workspace === null) {
        return Response.json({ error: "no workspace saved" }, { status: 404 });
      }
      return Response.json({ workspace });
    }
    if (url.pathname === "/workspace" && req.method === "PUT") {
      let body: { workspace?: WorkspaceState };
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: "invalid JSON body" }, { status: 400 });
      }
      const ws = body.workspace;
      if (
        !ws ||
        !ws.layers ||
        !("0" in ws.layers) ||
        !("1" in ws.layers) ||
        !("2" in ws.layers) ||
        !("3" in ws.layers)
      ) {
        return Response.json(
          { error: "workspace.layers must have keys 0, 1, 2, 3" },
          { status: 400 },
        );
      }
      await saveWorkspace(ws);
      return Response.json({ ok: true });
    }
    return new Response("not found", { status: 404 });
  },
  websocket: {
    open(_ws) {},
    message(ws, msg) {
      ptyManager.handleMessage(ws, msg);
    },
    close(ws) {
      ptyManager.cleanup(ws);
    },
  },
});

console.log(`ghovas server listening on http://localhost:${server.port}`);
