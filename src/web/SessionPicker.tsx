import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "./components/Modal";
import { Button } from "./components/Button";
import type { SessionMeta } from "../shared/types";

interface SessionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (sessionId: string) => void;
  onCreateNew: () => void;
  windowTitles: Map<string, string>;
}

export function SessionPicker({
  isOpen,
  onClose,
  onAttach,
  onCreateNew,
  windowTitles,
}: SessionPickerProps) {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/sessions")
      .then((r) => r.json() as Promise<SessionMeta[]>)
      .then((data) => setSessions(data.filter((s) => s.alive)))
      .catch(() => setSessions([]));
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Open terminal">
      <div className="flex flex-col min-w-[260px]">
        <Button
          variant="ghost"
          className="justify-start gap-2 text-sm"
          onPress={() => {
            onCreateNew();
            onClose();
          }}
        >
          <Plus size={16} aria-hidden />
          New session...
        </Button>
        {sessions.length > 0 && <div className="border-t border-white/15 my-1" />}
        {sessions.map((session) => {
          const title = windowTitles.get(session.id);
          return (
            <Button
              key={session.id}
              variant="ghost"
              className="justify-start gap-2 text-sm"
              onPress={() => {
                onAttach(session.id);
                onClose();
              }}
            >
              <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" aria-hidden />
              <span className="font-mono">{session.id}</span>
              {title != null && <span className="text-on-dark-muted">({title})</span>}
            </Button>
          );
        })}
      </div>
    </Modal>
  );
}
