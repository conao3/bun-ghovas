# bun-ghovas

Browser-native window manager: an infinite canvas where terminal and iframe windows live side by side in a multi-layer workspace.

Concept: [`conao3/idea` projects/bun-ghovas.md](https://github.com/conao3/idea/blob/master/projects/bun-ghovas.md)

## Features

- **L0 infinite canvas** — `@xyflow/react` ベースの無限キャンバス (pan / zoom / Background / built-in MiniMap / Controls)。Window は ReactFlow の custom node、drag は title bar の `.drag-handle`、resize は `NodeResizer` で 8 方位対応 (`src/web/Canvas.tsx`)
- **L1 / L2 / L3 layer switching** — per-layer UI mode (horizontal-tabs / vertical-tabs / floating capsule) and per-layer visibility (`src/web/LayerBar.tsx`, `src/web/LayerStripFloating.tsx`)
- **Terminal windows** — backed by ghostty-web + node-pty; per-session scrollback ring buffer and reattach replay (`src/web/components/Terminal.tsx`, `src/web/lib/ptyClient.ts`, `src/server/pty.ts`)
- **Iframe windows** — with URL bar (`src/web/Window.tsx`)
- **Window-create FAB** — popover to launch iframe or terminal windows (`src/web/CreateWindowFab.tsx`)
- **`Mod+K` command palette** (`src/web/CommandPalette.tsx`)
- **Bottom status bar** — active L0/L1/L2/L3 IDs and zoom percentage (`src/web/StatusBar.tsx`)
- **Workspace persistence** — `GET` / `PUT /workspace`, debounce auto-save, boot load。保存形式は ReactFlow native `viewport` + `nodes`。旧形式からの client-side migration は `src/web/lib/workspaceMigration.ts` (`src/server/workspaceStore.ts`, `src/web/lib/workspaceClient.ts`, `src/web/lib/useWorkspacePersistence.ts`)

## Architecture

The frontend is React 19, bundled by `Bun.build` and served from `/main.js`. React Aria Components (RAC) primitives are wrapped in `src/web/components/`. The backend runs under `Bun.serve`, handling HTTP and WebSocket on the same port. A PTY manager (`src/server/pty.ts`) uses the node-pty native module to spawn shells; the workspace store (`src/server/workspaceStore.ts`) persists state to `data/workspace.json`. Terminal sessions communicate over `/ws` with a JSON wire protocol (`open` / `input` / `resize` / `close` / `output` / `exit` / `error`) — see `src/server/pty.ts` for the full message shapes.

Canvas surface は `@xyflow/react` v12 が pan / zoom / node positioning / built-in MiniMap / Controls を提供。Window は `nodeTypes.window` の custom node として render され、drag は `dragHandle: ".drag-handle"`、resize は `<NodeResizer>` を経由。terminal / iframe コンテンツは zoom 中も物理サイズを維持するため `useFlowZoom` で逆 transform (`scale(1/zoom)`) を当てる (`src/web/lib/useFlowZoom.ts`)。

```text
src/
├── server/
│   ├── index.ts              # Bun.serve entry — HTTP + WebSocket routing
│   ├── pty.ts                # PTY manager, node-pty native, /ws handler
│   └── workspaceStore.ts     # GET/PUT /workspace, data/workspace.json
├── shared/
│   └── types.ts              # Shared TypeScript types
└── web/
    ├── main.tsx              # React entry point
    ├── App.tsx               # Root layout, keyboard bindings
    ├── Canvas.tsx            # L0 infinite canvas (pan / zoom / drag)
    ├── LayerBar.tsx          # L1–L3 layer strips (horizontal/vertical/floating)
    ├── LayerStripFloating.tsx # Draggable floating capsule strip
    ├── Window.tsx            # Iframe window + URL bar
    ├── CreateWindowFab.tsx   # FAB + popover for window creation
    ├── CommandPalette.tsx    # Mod+K command palette
    ├── StatusBar.tsx         # Bottom bar (layers + zoom)
    ├── components/           # Wrapped RAC primitives
    │   ├── Button.tsx
    │   ├── Modal.tsx
    │   ├── Tabs.tsx
    │   ├── Terminal.tsx      # ghostty-web terminal component
    │   └── TextField.tsx
    └── lib/
        ├── ptyClient.ts               # WebSocket PTY client
        ├── useFlowZoom.ts             # Inverse zoom transform for terminal/iframe
        ├── useWorkspacePersistence.ts # Auto-save hook
        ├── workspaceClient.ts         # HTTP workspace API client
        └── workspaceMigration.ts      # Client-side workspace format migration
```

## Development

Requires Nix flake + direnv (`nix develop` activates the devShell with Bun and node-pty build dependencies).

One-shot startup via [devo](https://github.com/conao3/rust-devo):

```sh
devo run
```

Or manually:

```sh
bun install
bun run dev
```

`bun run dev` starts the server with watch/rebuild on port 3000. Note: node-pty under Bun requires a `tty.ReadStream` EAGAIN workaround; the implementation is in `src/server/pty.ts`.

## Running

```sh
bun run src/server/index.ts
```

```sh
bun run scripts/pty-smoke.ts
```

## Testing

```sh
bun test
```

Currently exercises `workspaceStore`.

## Keyboard Shortcuts

| Shortcut | Action                |
|----------|-----------------------|
| `Mod+K`  | Open command palette  |

## Workspace Persistence

```sh
# Save workspace state
curl -X PUT -H 'content-type: application/json' \
  -d '{"workspace":{"layers":{"0":{"canvases":[],"uiMode":"horizontal-tabs","visible":true},"1":{"canvases":[],"uiMode":"horizontal-tabs","visible":true},"2":{"canvases":[],"uiMode":"horizontal-tabs","visible":true},"3":{"canvases":[],"uiMode":"horizontal-tabs","visible":true}}}}' \
  http://localhost:3000/workspace

# Load workspace state
curl http://localhost:3000/workspace
```

## Related Docs

- [Concept: conao3/idea projects/bun-ghovas.md](https://github.com/conao3/idea/blob/master/projects/bun-ghovas.md)
- [Design prompt: conao3/idea projects/bun-ghovas-design.md](https://github.com/conao3/idea/blob/master/projects/bun-ghovas-design.md)

## License

Apache-2.0
