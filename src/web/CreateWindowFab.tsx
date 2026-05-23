import { useState } from "react";
import { DialogTrigger, Popover, Dialog } from "react-aria-components";
import { Button } from "./components/Button";
import { UrlComboBox } from "./components/UrlComboBox";
import { Modal } from "./components/Modal";
import { recordVisit } from "./lib/iframeUrlHistory";

interface CreateWindowFabProps {
  onCreateIframeWindow: (url: string) => void;
  onCreateTerminalWindow: () => void;
}

export function CreateWindowFab({
  onCreateIframeWindow,
  onCreateTerminalWindow,
}: CreateWindowFabProps) {
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleOk = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    recordVisit(trimmed);
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
          data-tutorial="create-window"
          variant="primary"
          className="absolute bottom-[152px] right-4 w-9 h-9 leading-none z-10"
          style={{
            borderRadius: "50%",
            padding: 0,
            fontSize: 20,
          }}
        >
          +
        </Button>
        <Popover
          placement="top end"
          className="bg-surface-overlay border border-white/15 rounded-[6px] p-1 outline-none z-20"
        >
          <Dialog className="outline-none flex flex-col gap-0.5">
            {({ close }) => (
              <>
                <Button
                  variant="ghost"
                  className="w-full"
                  style={{
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
                  className="w-full"
                  style={{
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
          className="flex flex-col gap-4"
        >
          <UrlComboBox label="URL" value={url} onChange={setUrl} autoFocus />
          <div className="flex gap-2 justify-end">
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
