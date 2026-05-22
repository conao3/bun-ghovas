import { useState, useRef, useCallback } from "react";
import { Tabs, TabList, Tab, TabPanel } from "./components/Tabs";
import { Button } from "./components/Button";
import { ContextMenu, MenuItem } from "./components/Menu";
import { Modal } from "./components/Modal";
import { TextField } from "./components/TextField";
import { LayerStripFloating } from "./LayerStripFloating";
import type { WorkspaceState, LayerLevel, LayerState, LayerUiMode, CanvasState } from "../shared/types";

interface LayerBarProps {
  workspace: WorkspaceState;
  activeIds: Record<LayerLevel, string>;
  onActiveChange: (level: LayerLevel, id: string) => void;
  onUiModeChange: (level: LayerLevel, mode: LayerUiMode) => void;
  onVisibilityChange: (level: LayerLevel, visible: boolean) => void;
  onRenameCanvas: (level: LayerLevel, canvasId: string, name: string) => void;
  onDuplicateCanvas: (level: LayerLevel, canvasId: string) => void;
  onDeleteCanvas: (level: LayerLevel, canvasId: string) => void;
}

function useTabContextMenu(
  canvases: CanvasState[],
  onRename: (id: string, name: string) => void,
  onDuplicate: (id: string) => void,
  onDelete: (id: string) => void,
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
    [targetId, canvases, onDuplicate, onDelete],
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
}) {
  const ctx = useTabContextMenu(layer.canvases, onRenameCanvas, onDuplicateCanvas, onDeleteCanvas);

  return (
    <>
      <div
        ref={ctx.menuAnchorRef}
        style={{ position: "fixed", left: ctx.menuPos.x, top: ctx.menuPos.y, width: 0, height: 0, pointerEvents: "none" }}
      />
      <ContextMenu isOpen={ctx.menuOpen} onOpenChange={ctx.setMenuOpen} triggerRef={ctx.menuAnchorRef} onAction={ctx.handleMenuAction}>
        <MenuItem id="rename">Rename</MenuItem>
        <MenuItem id="duplicate">Duplicate</MenuItem>
        <MenuItem id="delete">Delete</MenuItem>
      </ContextMenu>
      <Modal isOpen={ctx.renameOpen} onClose={() => ctx.setRenameOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TextField value={ctx.renameValue} onChange={ctx.setRenameValue} aria-label="Canvas name" autoFocus />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            color: "#555",
            fontSize: 11,
            fontFamily: "monospace",
            padding: "0 4px",
            minWidth: 24,
            userSelect: "none",
          }}
        >
          L{level}
        </span>
        <Button
          variant="ghost"
          onPress={onUiModeChange}
          style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset" }}
        >
          ⇅
        </Button>
        <Button
          variant="ghost"
          onPress={onVisibilityChange}
          style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset" }}
        >
          👁
        </Button>
        <Tabs
          selectedKey={activeId}
          onSelectionChange={(key) => onSelectionChange(key as string)}
          style={{ flex: 1 }}
        >
          <TabList items={layer.canvases}>
            {(canvas) => (
              <Tab id={canvas.id}>
                <span
                  onContextMenu={(e) => ctx.handleContextMenu(e, canvas.id)}
                  style={{ display: "block", margin: "-6px -14px", padding: "6px 14px" }}
                >
                  {canvas.name ?? canvas.id}
                </span>
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
}) {
  const ctx = useTabContextMenu(layer.canvases, onRenameCanvas, onDuplicateCanvas, onDeleteCanvas);

  return (
    <>
      <div
        ref={ctx.menuAnchorRef}
        style={{ position: "fixed", left: ctx.menuPos.x, top: ctx.menuPos.y, width: 0, height: 0, pointerEvents: "none" }}
      />
      <ContextMenu isOpen={ctx.menuOpen} onOpenChange={ctx.setMenuOpen} triggerRef={ctx.menuAnchorRef} onAction={ctx.handleMenuAction}>
        <MenuItem id="rename">Rename</MenuItem>
        <MenuItem id="duplicate">Duplicate</MenuItem>
        <MenuItem id="delete">Delete</MenuItem>
      </ContextMenu>
      <Modal isOpen={ctx.renameOpen} onClose={() => ctx.setRenameOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TextField value={ctx.renameValue} onChange={ctx.setRenameValue} aria-label="Canvas name" autoFocus />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
        style={{
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          padding: "4px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "0 2px 4px",
          }}
        >
          <span
            style={{
              color: "#555",
              fontSize: 11,
              fontFamily: "monospace",
              userSelect: "none",
            }}
          >
            L{level}
          </span>
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
            style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset" }}
          >
            👁
          </Button>
        </div>
        <Tabs
          selectedKey={activeId}
          onSelectionChange={(key) => onSelectionChange(key as string)}
          orientation="vertical"
        >
          <TabList items={layer.canvases} orientation="vertical">
            {(canvas) => (
              <Tab id={canvas.id} orientation="vertical">
                <span
                  onContextMenu={(e) => ctx.handleContextMenu(e, canvas.id)}
                  style={{ display: "block", margin: "-6px -14px", padding: "6px 14px" }}
                >
                  {canvas.name ?? canvas.id}
                </span>
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
        style={{
          gridArea: "top",
          background: "#1e1e1e",
          borderBottom:
            horizontalLevels.length > 0 ? "1px solid rgba(255,255,255,0.12)" : undefined,
          flexShrink: 0,
        }}
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
          />
        ))}
      </div>
      <div
        style={{
          gridArea: "left",
          background: "#1e1e1e",
          borderRight:
            verticalLevels.length > 0 ? "1px solid rgba(255,255,255,0.12)" : undefined,
          display: "flex",
          flexDirection: "row",
        }}
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
          />
        ))}
      </div>
      {hiddenLevels.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 4,
            right: 4,
            display: "flex",
            gap: 4,
            zIndex: 100,
          }}
        >
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
