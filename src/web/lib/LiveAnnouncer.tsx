import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

type AnnouncePoliteness = "polite" | "assertive";
type AnnounceFunction = (message: string, politeness?: AnnouncePoliteness) => void;

const LiveAnnouncerCtx = createContext<AnnounceFunction>(() => {});

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeMsg, setPoliteMsg] = useState("");
  const [assertiveMsg, setAssertiveMsg] = useState("");

  const announce = useCallback<AnnounceFunction>((message, politeness = "polite") => {
    if (politeness === "assertive") {
      setAssertiveMsg(message);
    } else {
      setPoliteMsg(message);
    }
  }, []);

  return (
    <LiveAnnouncerCtx.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {politeMsg}
      </div>
      <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertiveMsg}
      </div>
    </LiveAnnouncerCtx.Provider>
  );
}

export function useAnnounce(): AnnounceFunction {
  const fn = useContext(LiveAnnouncerCtx);
  return fn;
}
