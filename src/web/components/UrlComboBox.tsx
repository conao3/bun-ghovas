import { useState } from "react";
import {
  ComboBox as RACComboBox,
  Input as RACInput,
  Label as RACLabel,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  Popover as RACPopover,
} from "react-aria-components";
import type { CSSProperties } from "react";
import { loadHistory } from "../lib/iframeUrlHistory";

type HistoryItem = { id: string };

interface UrlComboBoxProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  "aria-label"?: string;
  autoFocus?: boolean;
  inputStyle?: CSSProperties;
}

export function UrlComboBox({
  value,
  onChange,
  label,
  autoFocus,
  inputStyle,
  ...rest
}: UrlComboBoxProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const filtered = items.filter((item) => item.id.toLowerCase().includes(value.toLowerCase()));

  return (
    <RACComboBox<HistoryItem>
      inputValue={value}
      onInputChange={onChange}
      onSelectionChange={(key) => {
        if (typeof key === "string") onChange(key);
      }}
      allowsCustomValue
      items={filtered}
      aria-label={rest["aria-label"]}
      onOpenChange={(open) => {
        if (open) setItems(loadHistory().map((url) => ({ id: url })));
      }}
      className="flex flex-col gap-0.5 font-mono text-[12px]"
    >
      {label && <RACLabel className="text-white/50 text-[11px]">{label}</RACLabel>}
      <RACInput
        autoFocus={autoFocus}
        className="bg-black/40 border border-white/15 rounded-[3px] text-on-dark-strong font-mono text-[12px] py-[3px] px-2 outline-none w-full"
        style={inputStyle}
      />
      {filtered.length > 0 && (
        <RACPopover className="bg-surface-dark-elevated border border-white/15 rounded-[4px] p-1 outline-none z-50 min-w-[var(--trigger-width)]">
          <RACListBox<HistoryItem> className="outline-none max-h-48 overflow-auto">
            {(item) => (
              <RACListBoxItem
                id={item.id}
                textValue={item.id}
                className="px-2 py-1 font-mono text-[12px] text-on-dark-strong rounded-[3px] cursor-pointer outline-none data-[focused]:bg-white/10 truncate"
              >
                {item.id}
              </RACListBoxItem>
            )}
          </RACListBox>
        </RACPopover>
      )}
    </RACComboBox>
  );
}
