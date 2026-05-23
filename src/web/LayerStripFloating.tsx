import { useState, useRef, useEffect } from "react";
import { ArrowLeftRight, Eye, GripVertical } from "lucide-react";
import { Tabs, TabList, Tab, TabPanel } from "./components/Tabs";
import { Button } from "./components/Button";
import type { LayerLevel, LayerState } from "../shared/types";

interface LayerStripFloatingProps {
  level: LayerLevel;
  layer: LayerState;
  activeId: string;
  floatingIndex: number;
  onSelectionChange: (id: string) => void;
  onUiModeChange: () => void;
  onVisibilityChange: () => void;
}

export function LayerStripFloating({
  level,
  layer,
  activeId,
  floatingIndex,
  onSelectionChange,
  onUiModeChange,
  onVisibilityChange,
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

  const initialBottom = 24 + floatingIndex * 56;

  return (
    <div
      ref={capsuleRef}
      className="fixed z-[200] flex items-center bg-surface border border-white/[0.18] rounded-full"
      style={{
        boxShadow: "0 4px 16px color-mix(in srgb, black 50%, transparent)",
        ...(pos !== null
          ? { left: pos.x, top: pos.y }
          : { bottom: initialBottom, left: "50%", transform: "translateX(-50%)" }),
      }}
    >
      <div
        onMouseDown={handleGripMouseDown}
        className="cursor-grab py-1.5 pl-2.5 pr-2 text-text-faint select-none shrink-0"
      >
        <GripVertical size={14} aria-hidden />
      </div>
      <span className="text-text-faint text-[11px] font-mono px-0.5 select-none shrink-0">
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
      <Tabs selectedKey={activeId} onSelectionChange={(key) => onSelectionChange(key as string)}>
        <TabList items={layer.canvases} style={{ borderBottom: "none" }}>
          {(canvas) => <Tab id={canvas.id}>{canvas.id}</Tab>}
        </TabList>
        {layer.canvases.map((c) => (
          <TabPanel key={c.id} id={c.id} style={{ padding: 0, height: 0, overflow: "hidden" }} />
        ))}
      </Tabs>
    </div>
  );
}
