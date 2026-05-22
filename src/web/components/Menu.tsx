import {
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import type { MenuItemProps } from "react-aria-components";
import type { RefObject, ReactNode } from "react";

interface ContextMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<Element | null>;
  onAction: (key: string) => void;
  children: ReactNode;
}

export function ContextMenu({
  isOpen,
  onOpenChange,
  triggerRef,
  onAction,
  children,
}: ContextMenuProps) {
  return (
    <MenuTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <button
        tabIndex={-1}
        style={{
          position: "fixed",
          width: 0,
          height: 0,
          padding: 0,
          border: 0,
          outline: 0,
          background: "transparent",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      />
      <Popover
        triggerRef={triggerRef}
        placement="bottom start"
        style={{
          background: "#1e1e1e",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 4,
          padding: "4px 0",
          minWidth: 120,
          outline: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}
      >
        <RACMenu
          onAction={(key) => {
            onAction(String(key));
            onOpenChange(false);
          }}
          style={{ listStyle: "none", margin: 0, padding: 0, outline: "none" }}
        >
          {children}
        </RACMenu>
      </Popover>
    </MenuTrigger>
  );
}

export function MenuItem({ style, ...props }: MenuItemProps) {
  return (
    <RACMenuItem
      {...props}
      style={(renderProps) => ({
        padding: "6px 14px",
        fontSize: 13,
        fontFamily: "monospace",
        color: renderProps.isHovered || renderProps.isFocused ? "#fff" : "#ccc",
        background: renderProps.isHovered || renderProps.isFocused ? "#3a3a3a" : "transparent",
        cursor: "default",
        outline: "none",
        userSelect: "none",
        ...(typeof style === "function" ? style(renderProps) : style),
      })}
    />
  );
}
