import tailwind from "bun-plugin-tailwind";
import { watch } from "fs";
import { createPtyManager } from "./pty";
import {
  migrateFromLegacy,
  listWorkspaceNames,
  loadNamedWorkspace,
  saveNamedWorkspace,
  workspaceExists,
  deleteNamedWorkspace,
} from "./workspaceStore";
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
let installTimer: ReturnType<typeof setTimeout> | null = null;

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

function scheduleInstallAndRebuild() {
  if (rebuildTimer !== null) clearTimeout(rebuildTimer);
  rebuildTimer = null;
  if (installTimer !== null) clearTimeout(installTimer);
  installTimer = setTimeout(async () => {
    installTimer = null;
    console.log("package.json changed: running bun install...");
    const proc = Bun.spawn(["bun", "install"], { stdout: "inherit", stderr: "inherit" });
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      console.error(`BUILD_FAILED: bun install exit ${exitCode}`);
      return;
    }
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
watch(new URL("../../package.json", import.meta.url).pathname, scheduleInstallAndRebuild);

await migrateFromLegacy();

const ptyManager = createPtyManager();
console.log("node-pty native module loaded successfully");

const server = Bun.serve({
  port: PORT,
  idleTimeout: 0,
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
    if (url.pathname === "/sessions" && req.method === "GET") {
      return Response.json({ sessions: ptyManager.listSessions() });
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
    if (url.pathname === "/workspaces" && req.method === "GET") {
      const names = await listWorkspaceNames();
      return Response.json({ names, current: "default" });
    }
    if (url.pathname === "/workspaces" && req.method === "POST") {
      let body: { name?: string; workspace?: WorkspaceState };
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: "invalid JSON body" }, { status: 400 });
      }
      const { name, workspace: ws } = body;
      if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
        return Response.json({ error: "name must match [a-zA-Z0-9_-]+" }, { status: 400 });
      }
      if (name === "default") {
        return Response.json({ error: "cannot create: 'default' is reserved" }, { status: 400 });
      }
      if (await workspaceExists(name)) {
        return Response.json({ error: `workspace '${name}' already exists` }, { status: 400 });
      }
      if (!ws || !Array.isArray(ws.l3) || !Array.isArray(ws.l2) || !Array.isArray(ws.l1) || !Array.isArray(ws.l0) || !ws.layerConfig) {
        return Response.json({ error: "workspace must have l3/l2/l1/l0/layerConfig" }, { status: 400 });
      }
      await saveNamedWorkspace(name, ws);
      return Response.json({ ok: true });
    }
    const deleteMatch = url.pathname.match(/^\/workspaces\/([^/]+)$/);
    if (deleteMatch && req.method === "DELETE") {
      const name = deleteMatch[1];
      if (name === "default") {
        return Response.json({ error: "cannot delete default workspace" }, { status: 400 });
      }
      if (!(await workspaceExists(name))) {
        return Response.json({ error: `workspace '${name}' not found` }, { status: 404 });
      }
      await deleteNamedWorkspace(name);
      return Response.json({ ok: true });
    }
    if (url.pathname === "/workspace" && req.method === "GET") {
      const name = url.searchParams.get("name") ?? "default";
      const workspace = await loadNamedWorkspace(name);
      if (workspace === null) {
        return Response.json({ error: "no workspace saved" }, { status: 404 });
      }
      return Response.json({ workspace });
    }
    if (url.pathname === "/workspace" && req.method === "PUT") {
      const name = url.searchParams.get("name") ?? "default";
      let body: { workspace?: WorkspaceState };
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: "invalid JSON body" }, { status: 400 });
      }
      const ws = body.workspace;
      if (
        !ws ||
        !Array.isArray(ws.l3) ||
        !Array.isArray(ws.l2) ||
        !Array.isArray(ws.l1) ||
        !Array.isArray(ws.l0) ||
        !ws.layerConfig
      ) {
        return Response.json(
          { error: "workspace must have l3/l2/l1/l0/layerConfig" },
          { status: 400 },
        );
      }
      for (const canvas of ws.l0) {
        if (canvas != null && typeof canvas === "object" && "windows" in canvas) {
          return Response.json(
            { error: "legacy workspace shape; client must migrate" },
            { status: 400 },
          );
        }
      }
      await saveNamedWorkspace(name, ws);
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
