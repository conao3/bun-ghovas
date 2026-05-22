import { Button as RACButton } from "react-aria-components";
import type { ButtonProps as RACButtonProps } from "react-aria-components";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends RACButtonProps {
  variant?: ButtonVariant;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white border-accent",
  secondary: "bg-white/8 text-text-muted-light border-white/15",
  ghost: "bg-transparent text-text-muted-light border-transparent",
};

export function Button({ variant = "secondary", className, ...props }: ButtonProps) {
  const base = [
    "inline-flex items-center justify-center gap-1.5 py-1 px-3 rounded",
    "text-[13px] font-mono font-medium cursor-pointer",
    "border outline-none",
    "transition-[background,opacity] duration-150",
    "data-[disabled]:opacity-40",
    VARIANT_CLASS[variant],
  ].join(" ");
  return (
    <RACButton
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
