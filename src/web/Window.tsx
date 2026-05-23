import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Copy, Loader2, Pencil, RotateCw, X } from "lucide-react";
import { NodeResizer } from "@xyflow/react";
import type { WindowState } from "../shared/types";
import { Button } from "./components/Button";
import { TextField } from "./components/TextField";
import { UrlComboBox } from "./components/UrlComboBox";
import { Terminal } from "./components/Terminal";
import { ContextMenu, MenuItem } from "./components/Menu";
import { Modal } from "./components/Modal";
import { recordVisit } from "./lib/iframeUrlHistory";
import { loadBackendSettings } from "./lib/backendSettings";
import { useFlowZoom } from "./lib/useFlowZoom";

type IframeLoadState = "idle" | "loading" | "loaded" | "failed" | "likely-blocked";

export interface WindowCallbacks {
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onUrlChange: (id: string, url: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
}

interface WindowProps extends WindowCallbacks {
  win: WindowState;
  isFocused: boolean;
}

export function Window({
  win,
  isFocused,
  onFocus,
  onClose,
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
  const [urlNav, setUrlNav] = useState<{ history: string[]; index: number }>({
    history: [win.url ?? ""],
    index: 0,
  });
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (win.kind !== "iframe") return;
    setIframeState("loading");
    const timer = setTimeout(() => {
      setIframeState((prev) => (prev === "loading" ? "likely-blocked" : prev));
    }, 6000);
    return () => clearTimeout(timer);
  }, [win.url, win.kind]);

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
      setUrlNav((prev) => {
        const base = prev.history.slice(0, prev.index + 1).concat(urlInput);
        const trimmed = base.length > 50 ? base.slice(base.length - 50) : base;
        return { history: trimmed, index: trimmed.length - 1 };
      });
      onUrlChange(win.id, urlInput);
    },
    [win.id, urlInput, onUrlChange],
  );

  const handleBack = useCallback(() => {
    setUrlNav((prev) => {
      if (prev.index <= 0) return prev;
      const nextIndex = prev.index - 1;
      const url = prev.history[nextIndex];
      onUrlChange(win.id, url);
      setUrlInput(url);
      return { ...prev, index: nextIndex };
    });
  }, [win.id, onUrlChange]);

  const handleForward = useCallback(() => {
    setUrlNav((prev) => {
      if (prev.index >= prev.history.length - 1) return prev;
      const nextIndex = prev.index + 1;
      const url = prev.history[nextIndex];
      onUrlChange(win.id, url);
      setUrlInput(url);
      return { ...prev, index: nextIndex };
    });
  }, [win.id, onUrlChange]);

  const handleReload = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setIframeState("loading");
    }
  }, []);

  const handleWindowMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFocus(win.id);
    },
    [win.id, onFocus],
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

  const flowZoom = useFlowZoom();
  const backendSettings = useMemo(() => loadBackendSettings(), []);

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
        <MenuItem id="rename"><span className="inline-flex items-center gap-2"><Pencil size={12} aria-hidden /> Rename</span></MenuItem>
        <MenuItem id="duplicate"><span className="inline-flex items-center gap-2"><Copy size={12} aria-hidden /> Duplicate</span></MenuItem>
        <MenuItem id="close"><span className="inline-flex items-center gap-2"><X size={12} aria-hidden /> Close</span></MenuItem>
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
          inset: 0,
          zIndex: isFocused ? 100 : 10,
        }}
      >
        <div
          onContextMenu={handleTitleContextMenu}
          className={[
            "drag-handle h-8 min-h-8 flex items-center justify-between pr-1 pl-3 cursor-move select-none",
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
              className="px-2 py-1 shrink-0 flex items-center gap-1"
            >
              <Button
                variant="ghost"
                aria-label="back"
                isDisabled={urlNav.index <= 0}
                onPress={handleBack}
                style={{ padding: "0 4px", minWidth: 24, height: 24 }}
                className="data-[disabled]:cursor-not-allowed"
              >
                <ArrowLeft size={14} aria-hidden />
              </Button>
              <Button
                variant="ghost"
                aria-label="forward"
                isDisabled={urlNav.index >= urlNav.history.length - 1}
                onPress={handleForward}
                style={{ padding: "0 4px", minWidth: 24, height: 24 }}
                className="data-[disabled]:cursor-not-allowed"
              >
                <ArrowRight size={14} aria-hidden />
              </Button>
              <Button
                variant="ghost"
                aria-label="reload"
                onPress={handleReload}
                style={{ padding: "0 4px", minWidth: 24, height: 24 }}
              >
                <RotateCw size={14} aria-hidden />
              </Button>
              <div className="flex-1">
                <UrlComboBox
                  value={urlInput}
                  onChange={setUrlInput}
                  aria-label="URL"
                  inputStyle={{ width: "100%" }}
                />
              </div>
              {iframeState === "loading" && (
                <Loader2
                  size={14}
                  className="animate-spin text-text-muted"
                  aria-label="loading"
                  role="status"
                />
              )}
            </form>
            <div className="flex-1 overflow-hidden relative">
              <div
                style={{
                  transform: `scale(${1 / flowZoom})`,
                  transformOrigin: "top left",
                  width: `${100 * flowZoom}%`,
                  height: `${100 * flowZoom}%`,
                  position: "relative",
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={win.url ?? "about:blank"}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  className="absolute inset-0 border-0 w-full h-full"
                />
                {(iframeState === "failed" || iframeState === "likely-blocked") && (
                  <div className="absolute bottom-0 left-0 right-0 bg-surface/92 border-t border-white/10 py-2 px-3 flex items-center gap-2 font-mono text-[12px] text-white/50">
                    <span>This page may not allow embedding.</span>
                    <button
                      type="button"
                      aria-label="retry"
                      className="inline-flex items-center gap-1 text-accent hover:text-text-primary bg-transparent border-0 p-0 cursor-pointer"
                      onClick={() => {
                        setIframeState("loading");
                        if (iframeRef.current) {
                          iframeRef.current.src = iframeRef.current.src;
                        }
                      }}
                    >
                      <RotateCw size={12} aria-hidden /> Retry
                    </button>
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
          </div>
        ) : (
          <div
            className="flex-1 overflow-hidden bg-surface rounded-b-[5px]"
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div
              style={{
                transform: `scale(${1 / flowZoom})`,
                transformOrigin: "top left",
                width: `${100 * flowZoom}%`,
                height: `${100 * flowZoom}%`,
              }}
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
          </div>
        )}

        <NodeResizer
          isVisible={isFocused}
          minWidth={120}
          minHeight={60}
          lineClassName="!border-accent"
          handleClassName="!bg-accent"
        />
      </div>
    </>
  );
}
