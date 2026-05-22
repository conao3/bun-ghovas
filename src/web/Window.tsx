import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import type { WindowState } from "../shared/types";
import { Button } from "./components/Button";
import { TextField } from "./components/TextField";

const MIN_WIDTH = 160;
const MIN_HEIGHT = 80;
const TITLE_BAR_HEIGHT = 32;
const HANDLE_SIZE = 8;
const CORNER_SIZE = 12;

type ResizeDir = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

interface ResizeHandleDef {
  dir: ResizeDir;
  style: CSSProperties;
}

const RESIZE_HANDLES: ResizeHandleDef[] = [
  {
    dir: "n",
    style: {
      top: -HANDLE_SIZE / 2,
      left: CORNER_SIZE,
      right: CORNER_SIZE,
      height: HANDLE_SIZE,
      cursor: "ns-resize",
    },
  },
  {
    dir: "s",
    style: {
      bottom: -HANDLE_SIZE / 2,
      left: CORNER_SIZE,
      right: CORNER_SIZE,
      height: HANDLE_SIZE,
      cursor: "ns-resize",
    },
  },
  {
    dir: "e",
    style: {
      top: CORNER_SIZE,
      right: -HANDLE_SIZE / 2,
      bottom: CORNER_SIZE,
      width: HANDLE_SIZE,
      cursor: "ew-resize",
    },
  },
  {
    dir: "w",
    style: {
      top: CORNER_SIZE,
      left: -HANDLE_SIZE / 2,
      bottom: CORNER_SIZE,
      width: HANDLE_SIZE,
      cursor: "ew-resize",
    },
  },
  {
    dir: "ne",
    style: {
      top: -HANDLE_SIZE / 2,
      right: -HANDLE_SIZE / 2,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      cursor: "nesw-resize",
    },
  },
  {
    dir: "nw",
    style: {
      top: -HANDLE_SIZE / 2,
      left: -HANDLE_SIZE / 2,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      cursor: "nwse-resize",
    },
  },
  {
    dir: "se",
    style: {
      bottom: -HANDLE_SIZE / 2,
      right: -HANDLE_SIZE / 2,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      cursor: "nwse-resize",
    },
  },
  {
    dir: "sw",
    style: {
      bottom: -HANDLE_SIZE / 2,
      left: -HANDLE_SIZE / 2,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      cursor: "nesw-resize",
    },
  },
];

export interface WindowCallbacks {
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, x: number, y: number, width: number, height: number) => void;
  onUrlChange: (id: string, url: string) => void;
}

interface WindowProps extends WindowCallbacks {
  win: WindowState;
  panX: number;
  panY: number;
  zoom: number;
  isFocused: boolean;
}

export function Window({ win, panX, panY, zoom, isFocused, onFocus, onClose, onMove, onResize, onUrlChange }: WindowProps) {
  const [urlInput, setUrlInput] = useState(win.url ?? "");

  const screenX = panX + win.x * zoom;
  const screenY = panY + win.y * zoom;
  const screenW = win.width * zoom;
  const screenH = win.height * zoom;

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onUrlChange(win.id, urlInput);
    },
    [win.id, urlInput, onUrlChange],
  );

  const handleWindowMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFocus(win.id);
    },
    [win.id, onFocus],
  );

  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onFocus(win.id);

      const startClient = { x: e.clientX, y: e.clientY };
      const startWin = { x: win.x, y: win.y };
      const capturedZoom = zoom;

      const handleMove = (ev: MouseEvent) => {
        const dx = (ev.clientX - startClient.x) / capturedZoom;
        const dy = (ev.clientY - startClient.y) / capturedZoom;
        onMove(win.id, startWin.x + dx, startWin.y + dy);
      };

      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [win.id, win.x, win.y, zoom, onFocus, onMove],
  );

  const handleResizeMouseDown = useCallback(
    (dir: ResizeDir) => (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onFocus(win.id);

      const startClient = { x: e.clientX, y: e.clientY };
      const startWin = { x: win.x, y: win.y, width: win.width, height: win.height };
      const capturedZoom = zoom;

      const handleMove = (ev: MouseEvent) => {
        const dx = (ev.clientX - startClient.x) / capturedZoom;
        const dy = (ev.clientY - startClient.y) / capturedZoom;

        let { x, y, width, height } = startWin;

        if (dir.includes("e")) width = Math.max(MIN_WIDTH, width + dx);
        if (dir.includes("s")) height = Math.max(MIN_HEIGHT, height + dy);
        if (dir.includes("w")) {
          const newWidth = Math.max(MIN_WIDTH, width - dx);
          x = x + (width - newWidth);
          width = newWidth;
        }
        if (dir.includes("n")) {
          const newHeight = Math.max(MIN_HEIGHT, height - dy);
          y = y + (height - newHeight);
          height = newHeight;
        }

        onResize(win.id, x, y, width, height);
      };

      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [win.id, win.x, win.y, win.width, win.height, zoom, onFocus, onResize],
  );

  return (
    <div
      onMouseDown={handleWindowMouseDown}
      style={{
        position: "absolute",
        left: screenX,
        top: screenY,
        width: screenW,
        height: screenH,
        zIndex: isFocused ? 100 : 10,
        boxSizing: "border-box",
        border: isFocused ? "1.5px solid #4a9eff" : "1px solid rgba(255,255,255,0.15)",
        borderRadius: 6,
        background: "#242424",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
      }}
    >
      <div
        onMouseDown={handleTitleMouseDown}
        style={{
          height: TITLE_BAR_HEIGHT,
          minHeight: TITLE_BAR_HEIGHT,
          background: isFocused ? "#2d2d2d" : "#222",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px 0 12px",
          cursor: "move",
          userSelect: "none",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
          borderRadius: "5px 5px 0 0",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontFamily: "monospace",
            color: "#ccc",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}
        >
          {win.title}
        </span>
        <div onMouseDown={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
          <Button
            variant="ghost"
            onPress={() => onClose(win.id)}
            style={{
              padding: "0 4px",
              fontSize: 16,
              lineHeight: 1,
              color: "#888",
              minWidth: 24,
              height: 24,
            }}
          >
            ×
          </Button>
        </div>
      </div>

      {win.kind === "iframe" ? (
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            background: "#1e1e1e",
            display: "flex",
            flexDirection: "column",
            borderRadius: "0 0 5px 5px",
          }}
        >
          <form
            onSubmit={handleUrlSubmit}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ padding: "4px 8px", flexShrink: 0 }}
          >
            <TextField
              value={urlInput}
              onChange={setUrlInput}
              aria-label="URL"
              inputStyle={{ width: "100%" }}
            />
          </form>
          <iframe
            src={win.url ?? "about:blank"}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{
              flex: 1,
              border: "none",
              width: "100%",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            background: "#1e1e1e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.2)",
            fontFamily: "monospace",
            fontSize: 12,
            borderRadius: "0 0 5px 5px",
          }}
        >
          {win.kind}
        </div>
      )}

      {RESIZE_HANDLES.map(({ dir, style }) => (
        <div
          key={dir}
          onMouseDown={handleResizeMouseDown(dir)}
          style={{
            position: "absolute",
            ...style,
            zIndex: 20,
          }}
        />
      ))}
    </div>
  );
}
