import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { X } from "lucide-react";
import type { WindowState } from "../shared/types";
import { Button } from "./components/Button";
import { TextField } from "./components/TextField";
import { UrlComboBox } from "./components/UrlComboBox";
import { Terminal } from "./components/Terminal";
import { ContextMenu, MenuItem } from "./components/Menu";
import { Modal } from "./components/Modal";
import { recordVisit } from "./lib/iframeUrlHistory";
import { loadBackendSettings } from "./lib/backendSettings";

const MIN_WIDTH = 160;
const MIN_HEIGHT = 80;
const HANDLE_SIZE = 8;
const CORNER_SIZE = 12;

type ResizeDir = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
type IframeLoadState = "idle" | "loading" | "loaded" | "failed" | "likely-blocked";

interface ResizeHandleDef {
  dir: ResizeDir;
  style: CSSProperties;
}

function handleVisibleClass(dir: ResizeDir): string {
  if (dir.length === 2) {
    return "w-full h-full bg-accent rounded-[1px]";
  }
  if (dir === "n" || dir === "s") {
    return "absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-accent/40";
  }
  return "absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-accent/40";
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
      recordVisit(urlInput);
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

  const backendSettings = loadBackendSettings();

  return (
    <>
      <div
        ref={menuAnchorRef}
        className="fixed w-0 h-0 pointer-events-none"
        style={{ left: menuPos.x, top: menuPos.y }}
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
        <div className="flex flex-col gap-3">
          <TextField
            value={renameValue}
            onChange={setRenameValue}
            aria-label="Window title"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
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
        className={[
          "absolute box-border rounded-[6px] bg-surface-raised flex flex-col overflow-visible",
          isFocused ? "border-[1.5px] border-accent" : "border border-white/15",
        ].join(" ")}
        style={{
          left: screenX,
          top: screenY,
          width: screenW,
          height: screenH,
          zIndex: isFocused ? 100 : 10,
        }}
      >
        <div
          onMouseDown={handleTitleMouseDown}
          onContextMenu={handleTitleContextMenu}
          className={[
            "h-8 min-h-8 flex items-center justify-between pr-1 pl-3 cursor-move select-none",
            "border-b border-white/[0.08] shrink-0 rounded-t-[5px] overflow-hidden",
            isFocused ? "bg-surface-active" : "bg-surface-panel",
          ].join(" ")}
        >
          <span className="text-[13px] font-mono text-text-muted-light overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
            {win.title}
          </span>
          <div onMouseDown={(e) => e.stopPropagation()} className="shrink-0">
            <Button
              variant="ghost"
              onPress={() => onClose(win.id)}
              aria-label="close window"
              style={{
                padding: "0 4px",
                color: "var(--color-text-muted)",
                minWidth: 24,
                height: 24,
              }}
            >
              <X size={14} aria-hidden />
            </Button>
          </div>
        </div>

        {win.kind === "iframe" ? (
          <div className="flex-1 overflow-hidden bg-surface flex flex-col rounded-b-[5px]">
            <form
              onSubmit={handleUrlSubmit}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-2 py-1 shrink-0"
            >
              <UrlComboBox
                value={urlInput}
                onChange={setUrlInput}
                aria-label="URL"
                inputStyle={{ width: "100%" }}
              />
            </form>
            <div className="flex-1 relative">
              <iframe
                src={win.url ?? "about:blank"}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="absolute inset-0 border-0 w-full h-full"
              />
              {(iframeState === "failed" || iframeState === "likely-blocked") && (
                <div className="absolute bottom-0 left-0 right-0 bg-surface/92 border-t border-white/10 py-2 px-3 flex items-center gap-2 font-mono text-[12px] text-white/50">
                  <span>This page may not allow embedding.</span>
                  <a
                    href={win.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent no-underline"
                  >
                    Open in new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="flex-1 overflow-hidden bg-surface rounded-b-[5px]"
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {win.sessionId ? (
              <Terminal
                sessionId={win.sessionId}
                shell={backendSettings.shell || undefined}
                cwd={backendSettings.cwd || undefined}
                scrollbackMiB={backendSettings.scrollbackMiB}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 font-mono text-[12px]">
                no session bound
              </div>
            )}
          </div>
        )}

        {RESIZE_HANDLES.map(({ dir, style }) => (
          <div
            key={dir}
            onMouseDown={handleResizeMouseDown(dir)}
            className="absolute z-20"
            style={style}
          >
            {isFocused && <div className={handleVisibleClass(dir)} />}
          </div>
        ))}
      </div>
    </>
  );
}
