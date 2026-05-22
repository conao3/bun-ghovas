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
import type { CSSProperties } from "react";

type Orientation = "horizontal" | "vertical";

export function Tabs({ style, orientation = "horizontal", ...props }: RACTabsProps) {
  return (
    <RACTabs
      {...props}
      orientation={orientation}
      style={{
        display: "flex",
        flexDirection: orientation === "vertical" ? "row" : "column",
        fontFamily: "monospace",
        fontSize: 13,
        color: "#ccc",
        ...(style as CSSProperties),
      }}
    />
  );
}

export function TabList<T extends object>({
  style,
  orientation = "horizontal",
  ...props
}: TabListProps<T> & { orientation?: Orientation }) {
  return (
    <RACTabList<T>
      {...props}
      style={{
        display: "flex",
        flexDirection: orientation === "vertical" ? "column" : "row",
        gap: 0,
        ...(orientation === "vertical"
          ? { borderRight: "1px solid rgba(255,255,255,0.12)" }
          : { borderBottom: "1px solid rgba(255,255,255,0.12)" }),
        ...(style as CSSProperties),
      }}
    />
  );
}

export function Tab({
  style,
  orientation = "horizontal",
  ...props
}: TabProps & { orientation?: Orientation }) {
  return (
    <RACTab
      {...props}
      style={(renderProps) => ({
        padding: "6px 14px",
        cursor: "pointer",
        ...(orientation === "vertical"
          ? {
              borderRight: renderProps.isSelected ? "2px solid #4a9eff" : "2px solid transparent",
            }
          : {
              borderBottom: renderProps.isSelected ? "2px solid #4a9eff" : "2px solid transparent",
            }),
        color: renderProps.isSelected ? "#4a9eff" : "#999",
        background: "transparent",
        outline: "none",
        fontSize: 13,
        fontFamily: "monospace",
        fontWeight: renderProps.isSelected ? 500 : 400,
        opacity: renderProps.isDisabled ? 0.4 : 1,
        ...(typeof style === "function" ? style(renderProps) : style),
      })}
    />
  );
}

export function TabPanel({ style, ...props }: TabPanelProps) {
  return (
    <RACTabPanel
      {...props}
      style={{
        padding: "12px 0",
        outline: "none",
        color: "#ccc",
        ...(style as CSSProperties),
      }}
    />
  );
}
