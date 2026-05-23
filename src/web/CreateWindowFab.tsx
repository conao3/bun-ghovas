import { useState } from "react";
import { Plus } from "lucide-react";
import { DialogTrigger, Popover, Dialog } from "react-aria-components";
import { Button } from "./components/Button";
import { UrlComboBox } from "./components/UrlComboBox";
import { Modal } from "./components/Modal";
import { SessionPicker } from "./SessionPicker";
import { recordVisit } from "./lib/iframeUrlHistory";
import { normalizeUrl } from "./lib/normalizeUrl";

interface CreateWindowFabProps {
  onCreateIframeWindow: (url: string) => void;
  onCreateTerminalWindow: (sessionId?: string) => void;
  windowTitles?: Map<string, string>;
}

export function CreateWindowFab({
  onCreateIframeWindow,
  onCreateTerminalWindow,
  windowTitles = new Map(),
}: CreateWindowFabProps) {
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);

  const handleOk = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    recordVisit(normalized);
    onCreateIframeWindow(normalized);
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
          aria-label="create window"
          className="absolute bottom-[152px] right-4 w-9 h-9 leading-none z-10"
          style={{
            borderRadius: "50%",
            padding: 0,
          }}
        >
          <Plus size={20} aria-hidden />
        </Button>
        <Popover
          placement="top end"
          className="bg-surface-dark-elevated border border-white/15 rounded-[6px] p-1 outline-none z-20"
        >
          <Dialog aria-label="New window" className="outline-none flex flex-col gap-0.5">
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
                    setSessionPickerOpen(true);
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

      <Modal isOpen={urlModalOpen} onClose={handleCancel} ariaLabel="New iframe window">
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
      <SessionPicker
        isOpen={sessionPickerOpen}
        onClose={() => setSessionPickerOpen(false)}
        onAttach={(id) => onCreateTerminalWindow(id)}
        windowTitles={windowTitles}
      />
    </>
  );
}
