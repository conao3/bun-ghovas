import { LayoutGrid } from "lucide-react";
import { Modal } from "./components/Modal";
import { Button } from "./components/Button";

interface WelcomeProps {
  onDismiss: () => void;
}

export function Welcome({ onDismiss }: WelcomeProps) {
  return (
    <Modal isOpen={true} onClose={onDismiss}>
      <div className="flex flex-col items-center gap-4 py-3 px-2 text-center font-mono text-ink bg-canvas rounded-md -m-5">
        <LayoutGrid size={56} className="text-primary" aria-hidden />
        <h1 className="m-0 text-[28px] font-bold tracking-[2px] text-ink">ghovas</h1>
        <p className="m-0 text-sm text-muted">a browser-native window manager</p>
        <Button variant="primary" onPress={onDismiss} className="mt-2 !py-[6px] !px-6">
          始める
        </Button>
      </div>
    </Modal>
  );
}
