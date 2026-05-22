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

export function Tabs({ style, ...props }: RACTabsProps) {
  return (
    <RACTabs
      {...props}
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "monospace",
        fontSize: 13,
        color: "#ccc",
        ...(style as CSSProperties),
      }}
    />
  );
}

export function TabList<T extends object>({ style, ...props }: TabListProps<T>) {
  return (
    <RACTabList<T>
      {...props}
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 0,
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        ...(style as CSSProperties),
      }}
    />
  );
}

export function Tab({ style, ...props }: TabProps) {
  return (
    <RACTab
      {...props}
      style={(renderProps) => ({
        padding: "6px 14px",
        cursor: "pointer",
        borderBottom: renderProps.isSelected
          ? "2px solid #4a9eff"
          : "2px solid transparent",
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
