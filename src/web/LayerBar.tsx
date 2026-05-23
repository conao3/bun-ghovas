import { useState, useRef, useCallback } from "react";
import { ArrowLeftRight, Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Tabs, TabList, Tab, TabPanel } from "./components/Tabs";
import { Button } from "./components/Button";
import { ContextMenu, MenuItem } from "./components/Menu";
import { Modal } from "./components/Modal";
import { TextField } from "./components/TextField";
import { LayerStripFloating } from "./LayerStripFloating";
import type {
  WorkspaceState,
  LayerLevel,
  LayerState,
  LayerUiMode,
  CanvasStateV2,
} from "../shared/types";

interface LayerBarProps {
  workspace: WorkspaceState;
  activeIds: Record<LayerLevel, string>;
  onActiveChange: (level: LayerLevel, id: string) => void;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
  onRenameCanvas: (level: LayerLevel, canvasId: string, name: string) => void;
  onDuplicateCanvas: (level: LayerLevel, canvasId: string) => void;
  onDeleteCanvas: (level: LayerLevel, canvasId: string) => void;
  onNewCanvas: (level: LayerLevel) => void;
}

function useTabContextMenu(
  canvases: CanvasStateV2[],
  onRename: (id: string, name: string) => void,
  onDuplicate: (id: string) => void,
  onDelete: (id: string) => void,
  onNew: () => void,
) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [targetId, setTargetId] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const menuAnchorRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, canvasId: string) => {
    e.preventDefault();
    setTargetId(canvasId);
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }, []);

  const handleMenuAction = useCallback(
    (key: string) => {
      if (key === "new") {
        onNew();
        return;
      }
      if (!targetId) return;
      if (key === "rename") {
        const canvas = canvases.find((c) => c.id === targetId);
        setRenameValue(canvas ? (canvas.name ?? canvas.id) : targetId);
        setRenameOpen(true);
      } else if (key === "duplicate") {
        onDuplicate(targetId);
      } else if (key === "delete") {
        onDelete(targetId);
      }
    },
    [targetId, canvases, onDuplicate, onDelete, onNew],
  );

  const handleRenameCommit = useCallback(() => {
    if (targetId && renameValue.trim()) {
      onRename(targetId, renameValue.trim());
      setRenameOpen(false);
    }
  }, [targetId, renameValue, onRename]);

  return {
    menuOpen,
    setMenuOpen,
    menuPos,
    menuAnchorRef,
    renameOpen,
    setRenameOpen,
    renameValue,
    setRenameValue,
    handleContextMenu,
    handleMenuAction,
    handleRenameCommit,
  };
}

function HorizontalStrip({
  level,
  layer,
  activeId,
  isLast,
  onSelectionChange,
  onUiModeChange,
  onVisibilityChange,
  onRenameCanvas,
  onDuplicateCanvas,
  onDeleteCanvas,
  onNewCanvas,
}: {
  level: LayerLevel;
  layer: LayerState;
  activeId: string;
  isLast: boolean;
  onSelectionChange: (id: string) => void;
  onUiModeChange: () => void;
  onVisibilityChange: () => void;
  onRenameCanvas: (id: string, name: string) => void;
  onDuplicateCanvas: (id: string) => void;
  onDeleteCanvas: (id: string) => void;
  onNewCanvas: () => void;
}) {
  const ctx = useTabContextMenu(layer.canvases, onRenameCanvas, onDuplicateCanvas, onDeleteCanvas, onNewCanvas);

  return (
    <>
      <div
        ref={ctx.menuAnchorRef}
        className="fixed w-0 h-0 pointer-events-none"
        style={{ left: ctx.menuPos.x, top: ctx.menuPos.y }}
      />
      <ContextMenu
        isOpen={ctx.menuOpen}
        onOpenChange={ctx.setMenuOpen}
        triggerRef={ctx.menuAnchorRef}
        onAction={ctx.handleMenuAction}
      >
        <MenuItem id="new"><span className="inline-flex items-center gap-2"><Plus size={12} aria-hidden /> New canvas</span></MenuItem>
        <MenuItem id="rename"><span className="inline-flex items-center gap-2"><Pencil size={12} aria-hidden /> Rename</span></MenuItem>
        <MenuItem id="duplicate"><span className="inline-flex items-center gap-2"><Copy size={12} aria-hidden /> Duplicate</span></MenuItem>
        <MenuItem id="delete"><span className="inline-flex items-center gap-2"><Trash2 size={12} aria-hidden /> Delete</span></MenuItem>
      </ContextMenu>
      <Modal isOpen={ctx.renameOpen} onClose={() => ctx.setRenameOpen(false)}>
        <div className="flex flex-col gap-3">
          <TextField
            value={ctx.renameValue}
            onChange={ctx.setRenameValue}
            aria-label="Canvas name"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onPress={() => ctx.setRenameOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onPress={ctx.handleRenameCommit}>
              OK
            </Button>
          </div>
        </div>
      </Modal>
      <div
        className={["flex items-center", isLast ? "" : "border-b border-border-subtle"].join(" ")}
      >
        <span className="text-text-faint text-[11px] font-mono px-1 min-w-6 select-none">
          L{level}
        </span>
        <Button
          variant="ghost"
          onPress={onUiModeChange}
          aria-label="cycle UI mode"
          style={{ padding: "2px 4px", minWidth: "unset" }}
        >
          <ArrowLeftRight size={14} aria-hidden />
        </Button>
        <Button
          variant="ghost"
          onPress={onVisibilityChange}
          aria-label="hide layer"
          style={{ padding: "2px 4px", minWidth: "unset" }}
        >
          <Eye size={14} aria-hidden />
        </Button>
        <Tabs
          selectedKey={activeId}
          onSelectionChange={(key) => onSelectionChange(key as string)}
          className="flex-1"
        >
          <TabList items={layer.canvases}>
            {(canvas) => (
              <Tab
                id={canvas.id}
                onContextMenu={(e) => ctx.handleContextMenu(e, canvas.id)}
              >
                {canvas.name ?? canvas.id}
              </Tab>
            )}
          </TabList>
          {layer.canvases.map((c) => (
            <TabPanel key={c.id} id={c.id} style={{ padding: 0 }} />
          ))}
        </Tabs>
      </div>
    </>
  );
}

function VerticalColumn({
  level,
  layer,
  activeId,
  onSelectionChange,
  onUiModeChange,
  onVisibilityChange,
  onRenameCanvas,
  onDuplicateCanvas,
  onDeleteCanvas,
  onNewCanvas,
}: {
  level: LayerLevel;
  layer: LayerState;
  activeId: string;
  onSelectionChange: (id: string) => void;
  onUiModeChange: () => void;
  onVisibilityChange: () => void;
  onRenameCanvas: (id: string, name: string) => void;
  onDuplicateCanvas: (id: string) => void;
  onDeleteCanvas: (id: string) => void;
  onNewCanvas: () => void;
}) {
  const ctx = useTabContextMenu(layer.canvases, onRenameCanvas, onDuplicateCanvas, onDeleteCanvas, onNewCanvas);

  return (
    <>
      <div
        ref={ctx.menuAnchorRef}
        className="fixed w-0 h-0 pointer-events-none"
        style={{ left: ctx.menuPos.x, top: ctx.menuPos.y }}
      />
      <ContextMenu
        isOpen={ctx.menuOpen}
        onOpenChange={ctx.setMenuOpen}
        triggerRef={ctx.menuAnchorRef}
        onAction={ctx.handleMenuAction}
      >
        <MenuItem id="new"><span className="inline-flex items-center gap-2"><Plus size={12} aria-hidden /> New canvas</span></MenuItem>
        <MenuItem id="rename"><span className="inline-flex items-center gap-2"><Pencil size={12} aria-hidden /> Rename</span></MenuItem>
        <MenuItem id="duplicate"><span className="inline-flex items-center gap-2"><Copy size={12} aria-hidden /> Duplicate</span></MenuItem>
        <MenuItem id="delete"><span className="inline-flex items-center gap-2"><Trash2 size={12} aria-hidden /> Delete</span></MenuItem>
      </ContextMenu>
      <Modal isOpen={ctx.renameOpen} onClose={() => ctx.setRenameOpen(false)}>
        <div className="flex flex-col gap-3">
          <TextField
            value={ctx.renameValue}
            onChange={ctx.setRenameValue}
            aria-label="Canvas name"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onPress={() => ctx.setRenameOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onPress={ctx.handleRenameCommit}>
              OK
            </Button>
          </div>
        </div>
      </Modal>
      <div className="flex flex-col border-r border-border-subtle py-1">
        <div className="flex flex-col items-center gap-0.5 px-0.5 pb-1">
          <span className="text-text-faint text-[11px] font-mono select-none">L{level}</span>
          <Button
            variant="ghost"
            onPress={onUiModeChange}
            style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset" }}
          >
            ⇄
          </Button>
          <Button
            variant="ghost"
            onPress={onVisibilityChange}
            aria-label="hide layer"
            style={{ padding: "2px 4px", minWidth: "unset" }}
          >
            <Eye size={14} aria-hidden />
          </Button>
        </div>
        <Tabs
          selectedKey={activeId}
          onSelectionChange={(key) => onSelectionChange(key as string)}
          orientation="vertical"
        >
          <TabList items={layer.canvases} orientation="vertical">
            {(canvas) => (
              <Tab
                id={canvas.id}
                orientation="vertical"
                onContextMenu={(e) => ctx.handleContextMenu(e, canvas.id)}
              >
                {canvas.name ?? canvas.id}
              </Tab>
            )}
          </TabList>
          {layer.canvases.map((c) => (
            <TabPanel key={c.id} id={c.id} style={{ padding: 0 }} />
          ))}
        </Tabs>
      </div>
    </>
  );
}

export function LayerBar({
  workspace,
  activeIds,
  onActiveChange,
  onUiModeChange,
  onVisibilityChange,
  onRenameCanvas,
  onDuplicateCanvas,
  onDeleteCanvas,
  onNewCanvas,
}: LayerBarProps) {
  const allLevels: LayerLevel[] = [3, 2, 1];

  const horizontalLevels = allLevels.filter(
    (l) => workspace.layers[l].visible && workspace.layers[l].uiMode === "horizontal-tabs",
  );
  const verticalLevels = allLevels.filter(
    (l) => workspace.layers[l].visible && workspace.layers[l].uiMode === "vertical-tabs",
  );
  const hiddenLevels = allLevels.filter((l) => !workspace.layers[l].visible);

  const floatingLevels = allLevels.filter(
    (l) => workspace.layers[l].visible && workspace.layers[l].uiMode === "floating",
  );

  const cycleMode = (level: LayerLevel) => {
    const cur = workspace.layers[level].uiMode;
    const next: LayerUiMode =
      cur === "horizontal-tabs"
        ? "vertical-tabs"
        : cur === "vertical-tabs"
          ? "floating"
          : "horizontal-tabs";
    onUiModeChange(level, next);
  };

  return (
    <>
      <div
        data-tutorial="layer-bar"
        className={[
          "[grid-area:top] bg-surface shrink-0",
          horizontalLevels.length > 0 ? "border-b border-border" : "",
        ].join(" ")}
      >
        {horizontalLevels.map((level, i) => (
          <HorizontalStrip
            key={level}
            level={level}
            layer={workspace.layers[level]}
            activeId={activeIds[level]}
            isLast={i === horizontalLevels.length - 1}
            onSelectionChange={(id) => onActiveChange(level, id)}
            onUiModeChange={() => cycleMode(level)}
            onVisibilityChange={() => onVisibilityChange(level, false)}
            onRenameCanvas={(id, name) => onRenameCanvas(level, id, name)}
            onDuplicateCanvas={(id) => onDuplicateCanvas(level, id)}
            onDeleteCanvas={(id) => onDeleteCanvas(level, id)}
            onNewCanvas={() => onNewCanvas(level)}
          />
        ))}
      </div>
      <div
        className={[
          "[grid-area:left] bg-surface flex flex-row",
          verticalLevels.length > 0 ? "border-r border-border" : "",
        ].join(" ")}
      >
        {verticalLevels.map((level) => (
          <VerticalColumn
            key={level}
            level={level}
            layer={workspace.layers[level]}
            activeId={activeIds[level]}
            onSelectionChange={(id) => onActiveChange(level, id)}
            onUiModeChange={() => cycleMode(level)}
            onVisibilityChange={() => onVisibilityChange(level, false)}
            onRenameCanvas={(id, name) => onRenameCanvas(level, id, name)}
            onDuplicateCanvas={(id) => onDuplicateCanvas(level, id)}
            onDeleteCanvas={(id) => onDeleteCanvas(level, id)}
            onNewCanvas={() => onNewCanvas(level)}
          />
        ))}
      </div>
      {hiddenLevels.length > 0 && (
        <div className="fixed top-1 right-1 flex gap-1 z-[100]">
          {hiddenLevels.map((level) => (
            <Button
              key={level}
              variant="secondary"
              onPress={() => onVisibilityChange(level, true)}
              style={{ padding: "2px 8px", fontSize: 10 }}
            >
              show L{level}
            </Button>
          ))}
        </div>
      )}
      {floatingLevels.map((level, i) => (
        <LayerStripFloating
          key={level}
          level={level}
          layer={workspace.layers[level]}
          activeId={activeIds[level]}
          floatingIndex={i}
          onSelectionChange={(id) => onActiveChange(level, id)}
          onUiModeChange={() => cycleMode(level)}
          onVisibilityChange={() => onVisibilityChange(level, false)}
        />
      ))}
    </>
  );
}
