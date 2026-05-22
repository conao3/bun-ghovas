import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { WindowState } from "../shared/types";
import { Button } from "./components/Button";
import { TextField } from "./components/TextField";
import { Terminal } from "./components/Terminal";
import { ContextMenu, MenuItem } from "./components/Menu";
import { Modal } from "./components/Modal";

const MIN_WIDTH = 160;
const MIN_HEIGHT = 80;
const TITLE_BAR_HEIGHT = 32;
const HANDLE_SIZE = 8;
const CORNER_SIZE = 12;

type ResizeDir = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
type IframeLoadState = "idle" | "loading" | "loaded" | "failed" | "likely-blocked";

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

interface WindowCallbacks {
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, x: number, y: number, width: number, height: number) => void;
  onUrlChange: (id: string, url: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
}

interface WindowProps extends WindowCallbacks {
  win: WindowState;
  panX: number;
  panY: number;
  zoom: number;
  isFocused: boolean;
}

export function Window({
  win,
  panX,
  panY,
  zoom,
  isFocused,
  onFocus,
  onClose,
  onMove,
  onResize,
  onUrlChange,
  onRename,
  onDuplicate,
}: WindowProps) {
  const [urlInput, setUrlInput] = useState(win.url ?? "");
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [iframeState, setIframeState] = useState<IframeLoadState>("idle");
  const menuAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (win.kind !== "iframe") return;
    setIframeState("loading");
    const timer = setTimeout(() => {
      setIframeState((prev) => (prev === "loading" ? "likely-blocked" : prev));
    }, 6000);
    return () => clearTimeout(timer);
  }, [win.url, win.kind]);

  const screenX = panX + win.x * zoom;
  const screenY = panY + win.y * zoom;
  const screenW = win.width * zoom;
  const screenH = win.height * zoom;

  const handleIframeLoad = useCallback(() => {
    setIframeState("loaded");
  }, []);

  const handleIframeError = useCallback(() => {
    setIframeState("failed");
  }, []);

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

  const handleTitleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onFocus(win.id);
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    },
    [win.id, onFocus],
  );

  const handleMenuAction = useCallback(
    (key: string) => {
      if (key === "rename") {
        setRenameValue(win.title);
        setRenameOpen(true);
      } else if (key === "duplicate") {
        onDuplicate(win.id);
      } else if (key === "close") {
        onClose(win.id);
      }
    },
    [win.id, win.title, onDuplicate, onClose],
  );

  const handleRenameCommit = useCallback(() => {
    if (renameValue.trim()) {
      onRename(win.id, renameValue.trim());
      setRenameOpen(false);
    }
  }, [win.id, renameValue, onRename]);

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
    <>
      <div
        ref={menuAnchorRef}
        style={{
          position: "fixed",
          left: menuPos.x,
          top: menuPos.y,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
      <ContextMenu
        isOpen={menuOpen}
        onOpenChange={setMenuOpen}
        triggerRef={menuAnchorRef}
        onAction={handleMenuAction}
      >
        <MenuItem id="rename">Rename</MenuItem>
        <MenuItem id="duplicate">Duplicate</MenuItem>
        <MenuItem id="close">Close</MenuItem>
      </ContextMenu>
      <Modal isOpen={renameOpen} onClose={() => setRenameOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TextField
            value={renameValue}
            onChange={setRenameValue}
            aria-label="Window title"
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="secondary" onPress={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleRenameCommit}>
              OK
            </Button>
          </div>
        </div>
      </Modal>
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
          onContextMenu={handleTitleContextMenu}
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
            <div style={{ flex: 1, position: "relative" }}>
              <iframe
                src={win.url ?? "about:blank"}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{
                  position: "absolute",
                  inset: 0,
                  border: "none",
                  width: "100%",
                  height: "100%",
                }}
              />
              {(iframeState === "failed" || iframeState === "likely-blocked") && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "rgba(30,30,30,0.92)",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <span>This page may not allow embedding.</span>
                  <a
                    href={win.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#4a9eff", textDecoration: "none" }}
                  >
                    Open in new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              background: "#1e1e1e",
              borderRadius: "0 0 5px 5px",
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {win.sessionId ? (
              <Terminal sessionId={win.sessionId} />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              >
                no session bound
              </div>
            )}
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
    </>
  );
}
