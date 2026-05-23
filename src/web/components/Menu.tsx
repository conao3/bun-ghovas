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
        aria-hidden="true"
        tabIndex={-1}
        className="fixed size-0 p-0 border-0 outline-none bg-transparent pointer-events-none overflow-hidden"
      />
      <Popover
        triggerRef={triggerRef}
        placement="bottom start"
        className="bg-surface border border-white/15 rounded py-1 min-w-[120px] outline-none shadow-[0_4px_16px_color-mix(in_srgb,black_50%,transparent)]"
      >
        <RACMenu
          onAction={(key) => {
            onAction(String(key));
            onOpenChange(false);
          }}
          className="list-none m-0 p-0 outline-none"
        >
          {children}
        </RACMenu>
      </Popover>
    </MenuTrigger>
  );
}

export function MenuItem({ className, ...props }: MenuItemProps) {
  const base = [
    "py-1.5 px-3.5 text-[13px] font-mono",
    "text-text-muted-light bg-transparent cursor-default outline-none select-none",
    "data-[hovered]:text-white data-[hovered]:bg-surface-hover",
    "data-[focused]:text-white data-[focused]:bg-surface-hover",
  ].join(" ");
  return (
    <RACMenuItem
      {...props}
      className={
        typeof className === "function"
          ? (rp) => `${base} ${className(rp)}`
          : className
            ? `${base} ${className}`
            : base
      }
    />
  );
}
