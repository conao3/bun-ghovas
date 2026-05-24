import { ModalOverlay, Modal as RACModal, Dialog } from "react-aria-components";
import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

export function Modal({ isOpen, onClose, children, ariaLabel, ariaLabelledby, ariaDescribedby }: ModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]"
    >
      <RACModal className="bg-surface-dark-elevated border border-white/15 rounded-md p-5 min-w-[320px] outline-none">
        <Dialog aria-label={ariaLabel} aria-labelledby={ariaLabelledby} aria-describedby={ariaDescribedby} aria-modal className="outline-none">
          {children}
        </Dialog>
      </RACModal>
    </ModalOverlay>
  );
}
