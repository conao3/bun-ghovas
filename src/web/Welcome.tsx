import { Modal } from "./components/Modal";
import { Button } from "./components/Button";

interface WelcomeProps {
  onDismiss: () => void;
}

export function Welcome({ onDismiss }: WelcomeProps) {
  return (
    <Modal isOpen={true} onClose={onDismiss}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "12px 8px",
          textAlign: "center",
          fontFamily: "monospace",
          color: "#fff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>ghovas</h1>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
          a browser-native window manager
        </p>
        <Button variant="primary" onPress={onDismiss} style={{ marginTop: 8, padding: "6px 24px" }}>
          Get started
        </Button>
      </div>
    </Modal>
  );
}
