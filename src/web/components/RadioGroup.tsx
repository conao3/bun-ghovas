import { RadioGroup as RACRadioGroup, Radio as RACRadio } from "react-aria-components";
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
    "border border-dark-hairline",
    "text-on-dark-soft bg-transparent",
    "data-[selected]:bg-surface-dark-elevated data-[selected]:text-on-dark-strong",
    "data-[hovered]:bg-surface-dark-soft",
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
