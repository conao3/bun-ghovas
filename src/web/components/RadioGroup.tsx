import {
  RadioGroup as RACRadioGroup,
  Radio as RACRadio,
} from "react-aria-components";
import type {
  RadioGroupProps as RACRadioGroupProps,
  RadioProps as RACRadioProps,
} from "react-aria-components";

export function RadioGroup({ className, ...props }: RACRadioGroupProps) {
  const base = "flex items-center gap-1";
  return (
    <RACRadioGroup
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

export function Radio({ className, ...props }: RACRadioProps) {
  const base = [
    "py-[2px] px-[10px] rounded",
    "text-[12px] font-mono cursor-pointer outline-none",
    "border border-border",
    "text-text-muted bg-transparent",
    "data-[selected]:bg-surface-active data-[selected]:text-text-muted-light",
    "data-[hovered]:bg-surface-hover",
    "transition-colors duration-100",
  ].join(" ");
  return (
    <RACRadio
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
