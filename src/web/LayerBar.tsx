import { useState, useRef, useCallback, useEffect } from "react";
import clsx from "clsx";
import { ArrowLeftRight, Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  useDndContext,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tabs, TabList, Tab, TabPanel } from "./components/Tabs";
import { Button } from "./components/Button";
import { ContextMenu, MenuItem } from "./components/Menu";
import { Modal } from "./components/Modal";
import { TextField } from "./components/TextField";
import { LayerStripFloating } from "./LayerStripFloating";
import { SHORTCUTS, formatShortcut } from "./lib/shortcuts";
import { getChildrenAt } from "./lib/layerTree";
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
  onReorderCanvas: (level: LayerLevel, activeId: string, overId: string) => void;
}

function dotColorClass(hint: "ok" | "warn" | "err"): string {
  if (hint === "ok") return "bg-success";
  if (hint === "warn") return "bg-warning";
  return "bg-error";
}

function SortableTabItem({
  canvas,
  level,
  onContextMenu,
  onContextMenuFromKeyboard,
}: {
  canvas: CanvasStateV2;
  level: LayerLevel;
  onContextMenu: (e: React.MouseEvent) => void;
  onContextMenuFromKeyboard: (el: Element, canvasId: string) => void;
}) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: canvas.id,
  });
  const { active, over } = useDndContext();
  const isOver = !isDragging && active !== null && over?.id === canvas.id;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { opacity: 0.5, cursor: "grabbing" } : {}),
  };
  const elRef = useRef<HTMLElement | null>(null);
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      elRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu") {
        e.preventDefault();
        e.stopPropagation();
        onContextMenuFromKeyboard(el, canvas.id);
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [canvas.id, onContextMenuFromKeyboard]);
  return (
    <Tab
      id={canvas.id}
      variant={level === 3 ? "layer-l3" : "layer"}
      onContextMenu={onContextMenu}
      ref={setRef}
      style={style}
      className={isOver ? "border-l-2 border-primary" : undefined}
      {...listeners}
    >
      {canvas.statusHint && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${dotColorClass(canvas.statusHint)}`}
          aria-hidden
        />
      )}
      {canvas.name ?? canvas.id}
    </Tab>
  );
}

function SortableVerticalTabItem({
  canvas,
  onContextMenu,
  onContextMenuFromKeyboard,
}: {
  canvas: CanvasStateV2;
  onContextMenu: (e: React.MouseEvent) => void;
  onContextMenuFromKeyboard: (el: Element, canvasId: string) => void;
}) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: canvas.id,
  });
  const { active, over } = useDndContext();
  const isOver = !isDragging && active !== null && over?.id === canvas.id;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { opacity: 0.5, cursor: "grabbing" } : {}),
  };
  const elRef = useRef<HTMLElement | null>(null);
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      elRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu") {
        e.preventDefault();
        e.stopPropagation();
        onContextMenuFromKeyboard(el, canvas.id);
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [canvas.id, onContextMenuFromKeyboard]);
  return (
    <Tab
      id={canvas.id}
      variant="layer-vertical"
      onContextMenu={onContextMenu}
      ref={setRef}
      style={style}
      className={isOver ? "border-t-2 border-primary" : undefined}
      {...listeners}
    >
      <span
        className="w-[3px] h-[14px] rounded-[2px] shrink-0 bg-transparent group-data-[selected]:bg-primary"
        aria-hidden
      />
      <span className="w-[18px] h-[18px] rounded-[4px] bg-surface-dark-elevated inline-flex items-center justify-center font-mono text-[10px] text-on-dark-soft shrink-0">
        {(canvas.name ?? canvas.id)[0]?.toUpperCase()}
      </span>
      <span className="truncate">{canvas.name ?? canvas.id}</span>
    </Tab>
  );
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
  const [fromKeyboard, setFromKeyboard] = useState(false);
  const menuAnchorRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, canvasId: string) => {
    e.preventDefault();
    setFromKeyboard(false);
    setTargetId(canvasId);
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }, []);

  const handleContextMenuFromKeyboard = useCallback((el: Element, canvasId: string) => {
    const rect = el.getBoundingClientRect();
    setFromKeyboard(true);
    setTargetId(canvasId);
    setMenuPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
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
    fromKeyboard,
    renameOpen,
    setRenameOpen,
    renameValue,
    setRenameValue,
    handleContextMenu,
    handleContextMenuFromKeyboard,
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
  onReorderCanvas,
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
  onReorderCanvas: (activeId: string, overId: string) => void;
}) {
  const ctx = useTabContextMenu(
    layer.canvases,
    onRenameCanvas,
    onDuplicateCanvas,
    onDeleteCanvas,
    onNewCanvas,
  );
  const shortcutDef = SHORTCUTS.find((s) => s.id === `cycle-l${level}-canvas`);
  const metaHint = shortcutDef ? formatShortcut(shortcutDef) : null;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const ids = layer.canvases.map((c) => c.id);
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        onReorderCanvas(active.id as string, over.id as string);
      }
    },
    [onReorderCanvas],
  );

  const rowCls = clsx(
    "flex items-center px-4 gap-0.5",
    level === 3 && "h-9 bg-surface-dark",
    level === 2 && "h-8 bg-surface-dark-soft",
    level === 1 && "h-8 bg-dark-canvas",
    !isLast && level === 1 && "border-b border-dark-hairline",
    !isLast && level !== 1 && "border-b border-dark-hairline-soft",
  );

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
        autoFocus={ctx.fromKeyboard}
      >
        <MenuItem id="new">
          <span className="inline-flex items-center gap-2">
            <Plus size={12} aria-hidden /> New canvas
          </span>
        </MenuItem>
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
        <MenuItem id="delete">
          <span className="inline-flex items-center gap-2">
            <Trash2 size={12} aria-hidden /> Delete
          </span>
        </MenuItem>
      </ContextMenu>
      <Modal
        isOpen={ctx.renameOpen}
        onClose={() => ctx.setRenameOpen(false)}
        ariaLabel="Rename canvas"
      >
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
      <div className={rowCls}>
        {level === 3 && (
          <h1 className="font-serif text-on-dark-strong text-[12px] mr-2 select-none shrink-0">
            ghovas
          </h1>
        )}
        <span className="text-on-dark-muted text-[10px] font-mono tracking-[0.08em] uppercase mr-3 select-none shrink-0">
          L{level}
        </span>
        <Button
          variant="ghost"
          onPress={onUiModeChange}
          aria-label="cycle UI mode"
          style={{ padding: "2px 4px", minWidth: "unset", flexShrink: 0 }}
        >
          <ArrowLeftRight size={12} aria-hidden />
        </Button>
        <Button
          variant="ghost"
          onPress={onVisibilityChange}
          aria-label="hide layer"
          style={{ padding: "2px 4px", minWidth: "unset", flexShrink: 0 }}
        >
          <Eye size={12} aria-hidden />
        </Button>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
            <Tabs
              selectedKey={activeId}
              onSelectionChange={(key) => onSelectionChange(key as string)}
            >
              <TabList style={{ borderBottom: "none" }}>
                {layer.canvases.map((canvas) => (
                  <SortableTabItem
                    key={canvas.id}
                    canvas={canvas}
                    level={level}
                    onContextMenu={(e) => ctx.handleContextMenu(e, canvas.id)}
                    onContextMenuFromKeyboard={(el) =>
                      ctx.handleContextMenuFromKeyboard(el, canvas.id)
                    }
                  />
                ))}
              </TabList>
              {layer.canvases.map((c) => (
                <TabPanel key={c.id} id={c.id} style={{ padding: 0 }} />
              ))}
            </Tabs>
          </SortableContext>
        </DndContext>
        <button
          aria-label="new canvas"
          onClick={onNewCanvas}
          className="w-6 h-6 inline-flex items-center justify-center rounded-[6px] text-[14px] text-on-dark-muted hover:bg-white/[0.04] hover:text-on-dark cursor-pointer bg-transparent border-0 shrink-0"
        >
          +
        </button>
        <span className="flex-1" />
        {metaHint && (
          <span className="text-on-dark-muted text-[11px] font-mono px-2 select-none shrink-0">
            {metaHint}
          </span>
        )}
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
  onReorderCanvas,
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
  onReorderCanvas: (activeId: string, overId: string) => void;
}) {
  const ctx = useTabContextMenu(
    layer.canvases,
    onRenameCanvas,
    onDuplicateCanvas,
    onDeleteCanvas,
    onNewCanvas,
  );
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const ids = layer.canvases.map((c) => c.id);
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        onReorderCanvas(active.id as string, over.id as string);
      }
    },
    [onReorderCanvas],
  );

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
        autoFocus={ctx.fromKeyboard}
      >
        <MenuItem id="new">
          <span className="inline-flex items-center gap-2">
            <Plus size={12} aria-hidden /> New canvas
          </span>
        </MenuItem>
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
        <MenuItem id="delete">
          <span className="inline-flex items-center gap-2">
            <Trash2 size={12} aria-hidden /> Delete
          </span>
        </MenuItem>
      </ContextMenu>
      <Modal
        isOpen={ctx.renameOpen}
        onClose={() => ctx.setRenameOpen(false)}
        ariaLabel="Rename canvas"
      >
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
      <div className="w-[196px] flex flex-col border-r border-dark-hairline py-4 px-2 gap-0.5 bg-surface-dark">
        <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-dark-hairline-soft">
          <span className="text-on-dark-muted text-[10px] font-mono tracking-[0.08em] uppercase select-none">
            L{level}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              onPress={onUiModeChange}
              aria-label="cycle UI mode"
              style={{ padding: "2px 4px", minWidth: "unset" }}
            >
              <ArrowLeftRight size={12} aria-hidden />
            </Button>
            <Button
              variant="ghost"
              onPress={onVisibilityChange}
              aria-label="hide layer"
              style={{ padding: "2px 4px", minWidth: "unset" }}
            >
              <Eye size={12} aria-hidden />
            </Button>
          </div>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <Tabs
              selectedKey={activeId}
              onSelectionChange={(key) => onSelectionChange(key as string)}
              orientation="vertical"
            >
              <TabList
                orientation="vertical"
                style={{ borderRight: "none", gap: "2px" }}
              >
                {layer.canvases.map((canvas) => (
                  <SortableVerticalTabItem
                    key={canvas.id}
                    canvas={canvas}
                    onContextMenu={(e) => ctx.handleContextMenu(e, canvas.id)}
                    onContextMenuFromKeyboard={(el) =>
                      ctx.handleContextMenuFromKeyboard(el, canvas.id)
                    }
                  />
                ))}
              </TabList>
              {layer.canvases.map((c) => (
                <TabPanel key={c.id} id={c.id} style={{ padding: 0 }} />
              ))}
            </Tabs>
          </SortableContext>
        </DndContext>
        <div className="mt-auto pt-3 border-t border-dark-hairline-soft">
          <button
            aria-label="new canvas"
            onClick={onNewCanvas}
            className="flex items-center gap-[10px] px-[10px] py-2 rounded-[6px] w-full text-[13px] text-on-dark-soft hover:bg-white/[0.04] hover:text-on-dark cursor-pointer bg-transparent border-0"
          >
            <span className="w-[3px] h-[14px] rounded-[2px] shrink-0 bg-transparent" aria-hidden />
            <span className="w-[18px] h-[18px] rounded-[4px] bg-surface-dark-elevated inline-flex items-center justify-center font-mono text-[10px] text-on-dark-soft shrink-0">
              +
            </span>
            <span>New canvas</span>
          </button>
        </div>
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
  onReorderCanvas,
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

  const treeLayer = (level: LayerLevel): LayerState => ({
    ...workspace.layers[level],
    canvases: getChildrenAt(workspace, level, activeIds) as CanvasStateV2[],
  });

  return (
    <>
      <header
        data-tutorial="layer-bar"
        className={clsx(
          "[grid-area:top] bg-surface-dark shrink-0",
          horizontalLevels.length > 0 && "border-b border-dark-hairline",
        )}
      >
        {horizontalLevels.map((level, i) => (
          <HorizontalStrip
            key={level}
            level={level}
            layer={treeLayer(level)}
            activeId={activeIds[level]}
            isLast={i === horizontalLevels.length - 1}
            onSelectionChange={(id) => onActiveChange(level, id)}
            onUiModeChange={() => cycleMode(level)}
            onVisibilityChange={() => onVisibilityChange(level, false)}
            onRenameCanvas={(id, name) => onRenameCanvas(level, id, name)}
            onDuplicateCanvas={(id) => onDuplicateCanvas(level, id)}
            onDeleteCanvas={(id) => onDeleteCanvas(level, id)}
            onNewCanvas={() => onNewCanvas(level)}
            onReorderCanvas={(activeId, overId) => onReorderCanvas(level, activeId, overId)}
          />
        ))}
      </header>
      <nav
        aria-label="Layer navigation"
        className={clsx(
          "[grid-area:left] bg-surface-dark flex flex-row",
          verticalLevels.length > 0 && "border-r border-dark-hairline",
        )}
      >
        {verticalLevels.map((level) => (
          <VerticalColumn
            key={level}
            level={level}
            layer={treeLayer(level)}
            activeId={activeIds[level]}
            onSelectionChange={(id) => onActiveChange(level, id)}
            onUiModeChange={() => cycleMode(level)}
            onVisibilityChange={() => onVisibilityChange(level, false)}
            onRenameCanvas={(id, name) => onRenameCanvas(level, id, name)}
            onDuplicateCanvas={(id) => onDuplicateCanvas(level, id)}
            onDeleteCanvas={(id) => onDeleteCanvas(level, id)}
            onNewCanvas={() => onNewCanvas(level)}
            onReorderCanvas={(activeId, overId) => onReorderCanvas(level, activeId, overId)}
          />
        ))}
      </nav>
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
          layer={treeLayer(level)}
          activeId={activeIds[level]}
          floatingIndex={i}
          onSelectionChange={(id) => onActiveChange(level, id)}
          onUiModeChange={() => cycleMode(level)}
          onVisibilityChange={() => onVisibilityChange(level, false)}
          onNewCanvas={() => onNewCanvas(level)}
          onReorderCanvas={(activeId, overId) => onReorderCanvas(level, activeId, overId)}
        />
      ))}
    </>
  );
}
