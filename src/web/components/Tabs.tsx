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
  const base = [
    "flex font-mono text-[13px] text-on-dark-strong",
    orientation === "vertical" ? "flex-row" : "flex-col",
  ].join(" ");
  return (
    <RACTabs
      {...props}
      orientation={orientation}
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

export function TabList<T extends object>({
  className,
  orientation = "horizontal",
  ...props
}: TabListProps<T> & { orientation?: Orientation }) {
  const base = [
    "flex",
    orientation === "vertical"
      ? "flex-col border-r border-dark-hairline"
      : "flex-row border-b border-dark-hairline",
  ].join(" ");
  return (
    <RACTabList<T>
      {...props}
      className={
        typeof className === "function"
          ? (rp) => `${base} ${className(rp)}`
          : className
            ? `${base} ${className as string}`
            : base
      }
    />
  );
}

export function Tab({
  className,
  orientation = "horizontal",
  ...props
}: TabProps & { orientation?: Orientation }) {
  const base = [
    "py-1.5 px-3.5 cursor-pointer bg-transparent outline-none",
    "text-[13px] font-mono text-on-dark-muted font-normal",
    "data-[selected]:text-primary data-[selected]:font-medium",
    "data-[disabled]:opacity-40",
    orientation === "vertical"
      ? "border-r-2 border-r-transparent data-[selected]:border-r-primary"
      : "border-b-2 border-b-transparent data-[selected]:border-b-primary",
  ].join(" ");
  return (
    <RACTab
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

export function TabPanel({ className, ...props }: TabPanelProps) {
  const base = "py-3 outline-none text-on-dark-strong";
  return (
    <RACTabPanel
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
