import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

export type ToastKind = "success" | "warning" | "error";

export type Toast = { id: string; kind: ToastKind; message: string };

type ToastContextValue = { show: (kind: ToastKind, message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_COLORS: Record<ToastKind, string> = {
  success: "#3aaf5c",
  warning: "#d6a83f",
  error: "#c4564f",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => dismiss(toast.id)}
            style={{
              width: 280,
              backgroundColor: KIND_COLORS[toast.kind],
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              fontSize: 12,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}
