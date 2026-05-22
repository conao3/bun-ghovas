import { useState, useRef, useEffect } from "react";
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
      style={{
        position: "fixed",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        background: "#1e1e1e",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 999,
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        ...(pos !== null
          ? { left: pos.x, top: pos.y }
          : { bottom: initialBottom, left: "50%", transform: "translateX(-50%)" }),
      }}
    >
      <div
        onMouseDown={handleGripMouseDown}
        style={{
          cursor: "grab",
          padding: "6px 8px 6px 10px",
          color: "#555",
          userSelect: "none",
          fontSize: 14,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ⠿
      </div>
      <span
        style={{
          color: "#555",
          fontSize: 11,
          fontFamily: "monospace",
          padding: "0 2px",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        L{level}
      </span>
      <Button
        variant="ghost"
        onPress={onUiModeChange}
        style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset", flexShrink: 0 }}
      >
        ⊞
      </Button>
      <Button
        variant="ghost"
        onPress={onVisibilityChange}
        style={{ padding: "2px 4px", fontSize: 10, minWidth: "unset", flexShrink: 0 }}
      >
        👁
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
