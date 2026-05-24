import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeftRight, Eye, GripVertical } from "lucide-react";
import { useDndContext } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tabs, TabList, Tab, TabPanel } from "./components/Tabs";
import { Button } from "./components/Button";
import type { CanvasStateV2, LayerLevel, LayerState } from "../shared/types";

interface LayerStripFloatingProps {
  level: LayerLevel;
  layer: LayerState;
  activeId: string;
  floatingIndex: number;
  onSelectionChange: (id: string) => void;
  onUiModeChange: () => void;
  onVisibilityChange: () => void;
  onNewCanvas: () => void;
}

function SortableFloatingTabItem({
  canvas,
  level,
}: {
  canvas: CanvasStateV2;
  level: LayerLevel;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: canvas.id,
    data: { label: canvas.name ?? canvas.id, level },
    attributes: { roleDescription: "sortable" },
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
    elRef.current?.setAttribute("aria-roledescription", "sortable");
  }, []);
  return (
    <Tab
      id={canvas.id}
      variant={level === 3 ? "layer-l3" : "layer"}
      ref={setRef}
      style={style}
      className={isOver ? "border-l-2 border-primary" : undefined}
      {...attributes}
      {...listeners}
    >
      {canvas.statusHint && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${canvas.statusHint === "ok" ? "bg-success" : canvas.statusHint === "warn" ? "bg-warning" : "bg-error"}`}
          aria-hidden
        />
      )}
      {canvas.name ?? canvas.id}
    </Tab>
  );
}

export function LayerStripFloating({
  level,
  layer,
  activeId,
  floatingIndex,
  onSelectionChange,
  onUiModeChange,
  onVisibilityChange,
  onNewCanvas,
}: LayerStripFloatingProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; elemX: number; elemY: number } | null>(
    null,
  );
  const capsuleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !capsuleRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = dragRef.current.elemX + dx;
      const newY = dragRef.current.elemY + dy;
      const w = capsuleRef.current.offsetWidth;
      const h = capsuleRef.current.offsetHeight;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - w, newX)),
        y: Math.max(0, Math.min(window.innerHeight - h, newY)),
      });
    };
    const onMouseUp = () => {
      dragRef.current = null;
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleGripMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = capsuleRef.current!.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemX: rect.left,
      elemY: rect.top,
    };
    if (pos === null) {
      setPos({ x: rect.left, y: rect.top });
    }
  };

  const ids = layer.canvases.map((c) => c.id);

  const initialBottom = 24 + floatingIndex * 56;

  return (
    <div
      ref={capsuleRef}
      className="fixed z-[200] flex items-center bg-[rgba(31,30,27,0.92)] backdrop-blur-xl border border-dark-hairline rounded-full"
      style={{
        boxShadow: "0 4px 24px color-mix(in srgb, black 60%, transparent)",
        ...(pos !== null
          ? { left: pos.x, top: pos.y }
          : { bottom: initialBottom, left: "50%", transform: "translateX(-50%)" }),
      }}
    >
      <h2 className="sr-only">Floating layer strip</h2>
      <div
        onMouseDown={handleGripMouseDown}
        className="cursor-grab py-1.5 pl-2.5 pr-2 text-on-dark-muted select-none shrink-0"
      >
        <GripVertical size={14} aria-hidden />
      </div>
      <span className="text-on-dark-muted text-[11px] font-mono px-0.5 select-none shrink-0">
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
        <Eye size={14} aria-hidden />
      </Button>
      <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
        <Tabs
          selectedKey={activeId}
          onSelectionChange={(key) => onSelectionChange(key as string)}
        >
          <TabList style={{ borderBottom: "none" }}>
            {layer.canvases.map((canvas) => (
              <SortableFloatingTabItem key={canvas.id} canvas={canvas} level={level} />
            ))}
          </TabList>
          {layer.canvases.map((c) => (
            <TabPanel
              key={c.id}
              id={c.id}
              style={{ padding: 0, height: 0, overflow: "hidden" }}
            />
          ))}
        </Tabs>
      </SortableContext>
      <button
        aria-label="new canvas"
        onClick={onNewCanvas}
        className="w-6 h-6 inline-flex items-center justify-center rounded-full text-[14px] text-on-dark-muted hover:bg-white/[0.04] hover:text-on-dark cursor-pointer bg-transparent border-0 shrink-0 mr-1"
      >
        +
      </button>
    </div>
  );
}
