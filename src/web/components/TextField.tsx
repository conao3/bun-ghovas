import {
  TextField as RACTextField,
  Label as RACLabel,
  Input as RACInput,
} from "react-aria-components";
import type { TextFieldProps as RACTextFieldProps } from "react-aria-components";
import type { CSSProperties } from "react";

interface TextFieldProps extends RACTextFieldProps {
  label?: string;
  inputStyle?: CSSProperties;
}

export function TextField({ label, inputStyle, style, ...props }: TextFieldProps) {
  return (
    <RACTextField
      {...props}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        fontFamily: "monospace",
        fontSize: 12,
        ...(style as CSSProperties),
      }}
    >
      {label && (
        <RACLabel
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
          }}
        >
          {label}
        </RACLabel>
      )}
      <RACInput
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 3,
          color: "#ccc",
          fontFamily: "monospace",
          fontSize: 12,
          padding: "3px 8px",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          ...inputStyle,
        }}
      />
    </RACTextField>
  );
}
