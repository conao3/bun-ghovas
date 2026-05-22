import tailwind from "bun-plugin-tailwind";
import { createPtyManager } from "./pty";
import { loadWorkspace, saveWorkspace } from "./workspaceStore";
import type { WorkspaceState } from "../shared/types";

const PORT = Number(process.env.PORT ?? 3000);

const { version } = await Bun.file(new URL("../../package.json", import.meta.url)).json();
const startedAt = Date.now();

const indexHtmlPath = new URL("../web/index.html", import.meta.url);
const indexHtml = await Bun.file(indexHtmlPath).text();

const buildResult = await Bun.build({
  entrypoints: [
    new URL("../web/main.tsx", import.meta.url).pathname,
    new URL("../web/index.css", import.meta.url).pathname,
  ],
  target: "browser",
  plugins: [tailwind],
});
if (!buildResult.success) {
  for (const msg of buildResult.logs) console.error(msg);
  process.exit(1);
}
const mainJs = await buildResult.outputs.find((o) => o.path.endsWith(".js"))!.text();
const mainCss = await buildResult.outputs.find((o) => o.path.endsWith(".css"))!.text();

const ptyManager = createPtyManager();
console.log("node-pty native module loaded successfully");

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);
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
