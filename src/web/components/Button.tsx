import { Button as RACButton } from "react-aria-components";
import type { ButtonProps as RACButtonProps } from "react-aria-components";
import type { CSSProperties } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends RACButtonProps {
  variant?: ButtonVariant;
}

const BASE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "4px 12px",
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "monospace",
  fontWeight: 500,
  cursor: "pointer",
  border: "1px solid transparent",
  outline: "none",
  transition: "background 0.15s, opacity 0.15s",
};

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "#4a9eff",
    color: "#fff",
    borderColor: "#4a9eff",
  },
  secondary: {
    background: "rgba(255,255,255,0.08)",
    color: "#ccc",
    borderColor: "rgba(255,255,255,0.15)",
  },
  ghost: {
    background: "transparent",
    color: "#ccc",
    borderColor: "transparent",
  },
};

export function Button({ variant = "secondary", style, ...props }: ButtonProps) {
  return (
    <RACButton
      {...props}
      style={(renderProps) => ({
        ...BASE_STYLE,
        ...VARIANT_STYLES[variant],
        opacity: renderProps.isDisabled ? 0.4 : 1,
        ...(typeof style === "function" ? style(renderProps) : style),
      })}
    />
  );
}
