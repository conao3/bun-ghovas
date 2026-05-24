import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { TerminalSessionCtx } from "./SessionPicker";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Copy, Loader2, Minimize2, Pencil, RotateCw, X } from "lucide-react";
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
import { normalizeUrl } from "./lib/normalizeUrl";

type IframeLoadState = "idle" | "loading" | "loaded" | "failed" | "likely-blocked";

export interface WindowCallbacks {
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
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
  onMinimize,
  onUrlChange,
  onRename,
  onDuplicate,
}: WindowProps) {
  const [urlInput, setUrlInput] = useState(win.url ?? "");
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFromKeyboard, setMenuFromKeyboard] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [iframeState, setIframeState] = useState<IframeLoadState>("idle");
  const [iframeFocused, setIframeFocused] = useState(false);
  const [urlNav, setUrlNav] = useState<{ history: string[]; index: number }>({
    history: [win.url ?? ""],
    index: 0,
  });
  const [resizeAnnouncement, setResizeAnnouncement] = useState("");
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const windowElRef = useRef<HTMLDivElement>(null);
  const prevDimsRef = useRef({ width: win.width, height: win.height });

  useEffect(() => {
    const prev = prevDimsRef.current;
    if (prev.width !== win.width || prev.height !== win.height) {
      setResizeAnnouncement(`Window resized to ${win.width} by ${win.height} pixels`);
      prevDimsRef.current = { width: win.width, height: win.height };
    }
  }, [win.width, win.height]);

  useEffect(() => {
    if (win.kind !== "iframe") return;
    setIframeState("loading");
    const timer = setTimeout(() => {
      setIframeState((prev) => (prev === "loading" ? "likely-blocked" : prev));
    }, 6000);
    return () => clearTimeout(timer);
  }, [win.url, win.kind]);

  useEffect(() => {
    if (win.kind !== "iframe") return;
    const el = iframeContainerRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F6" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelector<HTMLElement>(".react-flow")?.focus();
      }
    };
    const handleFocusIn = () => setIframeFocused(true);
    const handleFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null)) {
        setIframeFocused(false);
      }
    };
    el.addEventListener("keydown", handleKeyDown, { capture: true });
    el.addEventListener("focusin", handleFocusIn);
    el.addEventListener("focusout", handleFocusOut);
    return () => {
      el.removeEventListener("keydown", handleKeyDown, { capture: true });
      el.removeEventListener("focusin", handleFocusIn);
      el.removeEventListener("focusout", handleFocusOut);
    };
  }, [win.kind]);

  useEffect(() => {
    const el = windowElRef.current?.closest<HTMLElement>(".react-flow__node");
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu") {
        e.preventDefault();
        e.stopPropagation();
        onFocus(win.id);
        setMenuFromKeyboard(true);
        const rect = el.getBoundingClientRect();
        setMenuPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        setMenuOpen(true);
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [win.id, onFocus]);

  const handleIframeLoad = useCallback(() => {
    setIframeState("loaded");
  }, []);

  const handleIframeError = useCallback(() => {
    setIframeState("failed");
  }, []);

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const normalized = normalizeUrl(urlInput);
      if (normalized === "") return;
      recordVisit(normalized);
      setUrlNav((prev) => {
        const base = prev.history.slice(0, prev.index + 1).concat(normalized);
        const trimmed = base.length > 50 ? base.slice(base.length - 50) : base;
        return { history: trimmed, index: trimmed.length - 1 };
      });
      onUrlChange(win.id, normalized);
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
      // oxlint-disable-next-line no-self-assign
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
      setMenuFromKeyboard(false);
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    },
    [win.id, onFocus],
  );

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu") {
        e.preventDefault();
        e.stopPropagation();
        onFocus(win.id);
        setMenuFromKeyboard(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        setMenuOpen(true);
      }
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
  const terminalCtx = useContext(TerminalSessionCtx);
  const sessionOpts =
    win.sessionId != null ? terminalCtx?.sessionOptsMap.get(win.sessionId) : undefined;

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {resizeAnnouncement}
      </div>
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
        autoFocus={menuFromKeyboard}
      >
        <MenuItem id="rename">
          <span className="inline-flex items-center gap-2">
            <Pencil size={12} aria-hidden /> Rename
          </span>
        </MenuItem>
        <MenuItem id="duplicate">
          <span className="inline-flex items-center gap-2">
            <Copy size={12} aria-hidden /> Duplicate
          </span>
        </MenuItem>
        <MenuItem id="close">
          <span className="inline-flex items-center gap-2">
            <X size={12} aria-hidden /> Close
          </span>
        </MenuItem>
      </ContextMenu>
      <Modal isOpen={renameOpen} onClose={() => setRenameOpen(false)} ariaLabel="Rename window">
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
        ref={windowElRef}
        onMouseDown={handleWindowMouseDown}
        onKeyDownCapture={(e) => {
          if (e.key !== "Escape") return;
          const t = e.target as HTMLElement;
          if (t instanceof HTMLInputElement || t instanceof HTMLButtonElement) return;
          const rfNode = (e.currentTarget as HTMLElement).closest(".react-flow__node");
          if (rfNode instanceof HTMLElement) {
            rfNode.focus();
            e.stopPropagation();
          }
        }}
        className={clsx(
          "absolute box-border rounded-[6px] bg-surface-dark flex flex-col overflow-visible",
          isFocused ? "border-[1.5px] border-primary" : "border border-white/15",
        )}
        style={{
          inset: 0,
          zIndex: isFocused ? 100 : 10,
        }}
      >
        <div
          onContextMenu={handleTitleContextMenu}
          onKeyDown={handleTitleKeyDown}
          tabIndex={0}
          className={clsx(
            "drag-handle h-8 min-h-8 flex items-center gap-2 pr-1 pl-3 cursor-move select-none outline-none",
            "border-b border-white/[0.08] shrink-0 rounded-t-[5px] overflow-hidden",
            isFocused ? "bg-dark-titlebar-focused" : "bg-dark-titlebar",
          )}
        >
          <button
            type="button"
            aria-label="Window menu"
            aria-haspopup="menu"
            tabIndex={-1}
            className="flex gap-1.5 shrink-0 bg-transparent border-0 p-0 m-0 cursor-pointer outline-none"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleTitleContextMenu}
          >
            <span className="w-3 h-3 rounded-full bg-error" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-warning" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-success" aria-hidden="true" />
          </button>
          <span className="text-[13px] font-mono text-on-dark-strong truncate flex-1 min-w-0">
            {win.title}
          </span>
          <div onMouseDown={(e) => e.stopPropagation()} className="flex shrink-0">
            <Button
              variant="ghost"
              onPress={() => onMinimize(win.id)}
              aria-label="minimize"
              style={{
                padding: "0 4px",
                color: "var(--color-on-dark-soft)",
                minWidth: 24,
                height: 24,
              }}
            >
              <Minimize2 size={14} aria-hidden />
            </Button>
            <Button
              variant="ghost"
              onPress={() => onClose(win.id)}
              aria-label="close window"
              style={{
                padding: "0 4px",
                color: "var(--color-on-dark-soft)",
                minWidth: 24,
                height: 24,
              }}
            >
              <X size={14} aria-hidden />
            </Button>
          </div>
        </div>

        {!win.minimized && (win.kind === "iframe" ? (
          <div data-window-content className="flex-1 overflow-hidden bg-surface-dark flex flex-col rounded-b-[5px]">
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
                  className="animate-spin text-on-dark-soft"
                  aria-label="loading"
                  role="status"
                />
              )}
            </form>
            <div className="flex-1 overflow-hidden relative" ref={iframeContainerRef}>
              <span id={`iframe-escape-hint-${win.id}`} className="sr-only">
                Press F6 to exit iframe and return to canvas
              </span>
              {iframeFocused && (
                <div
                  className="absolute top-0 left-0 right-0 z-10 bg-surface-dark/80 py-0.5 px-2 text-[11px] text-on-dark-soft text-center pointer-events-none"
                  aria-hidden="true"
                >
                  Press F6 to exit
                </div>
              )}
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
                  title={win.url ? `Embedded page: ${win.url}` : "Iframe pending URL"}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  className="absolute inset-0 border-0 w-full h-full"
                  aria-describedby={`iframe-escape-hint-${win.id}`}
                />
                {(iframeState === "failed" || iframeState === "likely-blocked") && (
                  <div className="absolute bottom-0 left-0 right-0 bg-surface-dark/92 border-t border-white/10 py-2 px-3 flex items-center gap-2 font-mono text-[12px] text-white/50">
                    <span>This page may not allow embedding.</span>
                    <button
                      type="button"
                      aria-label="retry"
                      className="inline-flex items-center gap-1 text-primary hover:text-on-dark bg-transparent border-0 p-0 cursor-pointer"
                      onClick={() => {
                        setIframeState("loading");
                        if (iframeRef.current) {
                          // oxlint-disable-next-line no-self-assign
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
                      className="text-primary no-underline"
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
            data-window-content
            className="flex-1 overflow-hidden bg-surface-dark rounded-b-[5px]"
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
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
                  shell={sessionOpts?.shell ?? (backendSettings.shell || undefined)}
                  cwd={sessionOpts?.cwd ?? (backendSettings.cwd || undefined)}
                  scrollbackMiB={backendSettings.scrollbackMiB}
                  env={sessionOpts?.env}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 font-mono text-[12px]">
                  no session bound
                </div>
              )}
            </div>
          </div>
        ))}

        <NodeResizer
          isVisible={isFocused && !win.minimized}
          minWidth={120}
          minHeight={60}
          lineClassName="!border-primary"
          handleClassName="!bg-primary"
        />
      </div>
    </>
  );
}
