import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";

export type ToastKind = "success" | "warning" | "error";

export type Toast = { id: string; kind: ToastKind; message: string };

type ToastContextValue = { show: (kind: ToastKind, message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_BG_CLASSES: Record<ToastKind, string> = {
  success: "bg-status-success",
  warning: "bg-status-warning",
  error: "bg-status-error",
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
      <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => dismiss(toast.id)}
            className={clsx(
              "w-[280px] text-white py-2 px-3 rounded shadow-[0_2px_8px_var(--tw-shadow-color)] shadow-black/40 text-[12px] cursor-pointer pointer-events-auto",
              KIND_BG_CLASSES[toast.kind],
            )}
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
