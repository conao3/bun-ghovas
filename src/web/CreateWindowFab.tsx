import { useState } from "react";
import { DialogTrigger, Popover, Dialog } from "react-aria-components";
import { Button } from "./components/Button";
import { TextField } from "./components/TextField";
import { Modal } from "./components/Modal";

interface CreateWindowFabProps {
  onCreateIframeWindow: (url: string) => void;
  onCreateTerminalWindow: () => void;
}

export function CreateWindowFab({ onCreateIframeWindow, onCreateTerminalWindow }: CreateWindowFabProps) {
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleOk = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onCreateIframeWindow(trimmed);
    setUrlModalOpen(false);
    setUrl("");
  };

  const handleCancel = () => {
    setUrlModalOpen(false);
    setUrl("");
  };

  return (
    <>
      <DialogTrigger>
        <Button
          variant="primary"
          style={{
            position: "absolute",
            bottom: 56,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: "50%",
            padding: 0,
            fontSize: 20,
            lineHeight: 1,
            zIndex: 10,
          }}
        >
          +
        </Button>
        <Popover
          placement="top end"
          style={{
            background: "#2a2a2a",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            padding: 4,
            outline: "none",
            zIndex: 20,
          }}
        >
          <Dialog style={{ outline: "none", display: "flex", flexDirection: "column", gap: 2 }}>
            {({ close }) => (
              <>
                <Button
                  variant="ghost"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    padding: "6px 12px",
                  }}
                  onPress={() => {
                    close();
                    onCreateTerminalWindow();
                  }}
                >
                  Terminal
                </Button>
                <Button
                  variant="ghost"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    padding: "6px 12px",
                  }}
                  onPress={() => {
                    close();
                    setUrlModalOpen(true);
                  }}
                >
                  iframe
                </Button>
              </>
            )}
          </Dialog>
        </Popover>
      </DialogTrigger>

      <Modal isOpen={urlModalOpen} onClose={handleCancel}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleOk();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <TextField
            label="URL"
            value={url}
            onChange={setUrl}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button type="button" variant="secondary" onPress={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              OK
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
