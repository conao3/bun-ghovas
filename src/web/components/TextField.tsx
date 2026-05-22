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

export function TextField({ label, inputStyle, className, ...props }: TextFieldProps) {
  return (
    <RACTextField
      {...props}
      className={
        className
          ? `flex flex-col gap-0.5 font-mono text-[12px] ${className as string}`
          : "flex flex-col gap-0.5 font-mono text-[12px]"
      }
    >
      {label && (
        <RACLabel className="text-white/50 text-[11px]">{label}</RACLabel>
      )}
      <RACInput
        className="bg-black/40 border border-white/15 rounded-[3px] text-text-muted-light font-mono text-[12px] py-[3px] px-2 outline-none w-full"
        style={inputStyle}
      />
    </RACTextField>
  );
}
