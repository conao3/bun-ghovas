import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToastKind = "success" | "warning" | "error";

export type Toast = { id: string; kind: ToastKind; message: string };

type ToastContextValue = { show: (kind: ToastKind, message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_BG_CLASSES: Record<ToastKind, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

const KIND_ICONS: Record<ToastKind, LucideIcon> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
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
        {toasts.map((toast) => {
          const Icon = KIND_ICONS[toast.kind];
          return (
            <div
              key={toast.id}
              onClick={() => dismiss(toast.id)}
              className={clsx(
                "w-[280px] text-white py-2 px-3 rounded shadow-[0_2px_8px_var(--tw-shadow-color)] shadow-black/40 text-[12px] cursor-pointer pointer-events-auto",
                KIND_BG_CLASSES[toast.kind],
              )}
            >
              <span className="inline-flex items-start gap-2">
                <Icon size={14} className="shrink-0 mt-0.5" aria-hidden />
                <span>{toast.message}</span>
              </span>
            </div>
          );
        })}
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
