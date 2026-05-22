const PORT = Number(process.env.PORT ?? 3000);

const { version } = await Bun.file(new URL("../../package.json", import.meta.url)).json();
const startedAt = Date.now();

const indexHtmlPath = new URL("../web/index.html", import.meta.url);
const indexHtml = await Bun.file(indexHtmlPath).text();

const buildResult = await Bun.build({
  entrypoints: [new URL("../web/main.tsx", import.meta.url).pathname],
  target: "browser",
});
if (!buildResult.success) {
  for (const msg of buildResult.logs) console.error(msg);
  process.exit(1);
}
const mainJs = await buildResult.outputs[0].text();

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
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
    return new Response("not found", { status: 404 });
  },
  websocket: {
    open(ws) {
      ws.send(JSON.stringify({ type: "hello", from: "ghovas" }));
    },
    message(ws, msg) {
      ws.send(msg);
    },
  },
});

console.log(`ghovas server listening on http://localhost:${server.port}`);
