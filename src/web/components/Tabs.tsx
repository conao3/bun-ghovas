import type React from "react";
import clsx from "clsx";
import {
  Tabs as RACTabs,
  TabList as RACTabList,
  Tab as RACTab,
  TabPanel as RACTabPanel,
} from "react-aria-components";
import type {
  TabsProps as RACTabsProps,
  TabListProps,
  TabProps,
  TabPanelProps,
} from "react-aria-components";

type Orientation = "horizontal" | "vertical";

export function Tabs({ className, orientation = "horizontal", ...props }: RACTabsProps) {
  const base = clsx(
    "flex font-mono text-[13px] text-on-dark-strong",
    orientation === "vertical" ? "flex-row" : "flex-col",
  );
  return (
    <RACTabs
      {...props}
      orientation={orientation}
      className={
        typeof className === "function" ? (rp) => clsx(base, className(rp)) : clsx(base, className)
      }
    />
  );
}

export function TabList<T extends object>({
  className,
  orientation = "horizontal",
  ...props
}: TabListProps<T> & { orientation?: Orientation }) {
  const base = clsx(
    "flex",
    orientation === "vertical"
      ? "flex-col border-r border-dark-hairline"
      : "flex-row border-b border-dark-hairline",
  );
  return (
    <RACTabList<T>
      {...props}
      className={
        typeof className === "function"
          ? (rp) => clsx(base, className(rp))
          : clsx(base, className as string | undefined)
      }
    />
  );
}

export function Tab({
  className,
  orientation = "horizontal",
  variant = "default",
  ref,
  ...props
}: TabProps & {
  orientation?: Orientation;
  variant?: "default" | "layer" | "layer-l3" | "layer-vertical";
  ref?: React.Ref<HTMLDivElement>;
}) {
  let base: string;
  if (variant === "layer" || variant === "layer-l3") {
    base = clsx(
      "inline-flex items-center gap-[6px] h-6 px-[10px] cursor-pointer outline-none",
      "text-[12px] font-sans font-medium text-on-dark-soft rounded-[6px]",
      "hover:bg-white/[0.04] hover:text-on-dark",
      "data-[disabled]:opacity-40",
      variant === "layer"
        ? "data-[selected]:bg-surface-dark-elevated data-[selected]:text-on-dark data-[selected]:shadow-[inset_0_0_0_1px_var(--color-dark-hairline)]"
        : "data-[selected]:rounded-none data-[selected]:shadow-[inset_0_-2px_0_0_var(--color-primary)] data-[selected]:text-on-dark",
    );
  } else if (variant === "layer-vertical") {
    base = clsx(
      "group flex items-center gap-[10px] px-[10px] py-2 rounded-[6px] w-full",
      "text-[13px] text-on-dark-soft cursor-pointer outline-none",
      "hover:bg-white/[0.04] hover:text-on-dark",
      "data-[selected]:bg-surface-dark-elevated data-[selected]:text-on-dark data-[selected]:shadow-[inset_0_0_0_1px_var(--color-dark-hairline)]",
      "data-[disabled]:opacity-40",
    );
  } else {
    base = clsx(
      "py-1.5 px-3.5 cursor-pointer bg-transparent outline-none",
      "text-[13px] font-mono text-on-dark-muted font-normal",
      "data-[selected]:text-primary data-[selected]:font-medium",
      "data-[disabled]:opacity-40",
      orientation === "vertical"
        ? "border-r-2 border-r-transparent data-[selected]:border-r-primary"
        : "border-b-2 border-b-transparent data-[selected]:border-b-primary",
    );
  }
  return (
    <RACTab
      ref={ref}
      {...props}
      className={
        typeof className === "function" ? (rp) => clsx(base, className(rp)) : clsx(base, className)
      }
    />
  );
}

export function TabPanel({ className, ...props }: TabPanelProps) {
  const base = "py-3 outline-none text-on-dark-strong";
  return (
    <RACTabPanel
      {...props}
      className={
        typeof className === "function" ? (rp) => clsx(base, className(rp)) : clsx(base, className)
      }
    />
  );
}
