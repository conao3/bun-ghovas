import { ModalOverlay, Modal as RACModal, Dialog } from "react-aria-components";
import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <RACModal
        style={{
          background: "#2a2a2a",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 6,
          padding: 20,
          minWidth: 320,
          outline: "none",
        }}
      >
        <Dialog style={{ outline: "none" }}>{children}</Dialog>
      </RACModal>
    </ModalOverlay>
  );
}
