import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "./components/Button";

interface TutorialStep {
  key: string;
  title: string;
  description: string;
}

const STEPS: TutorialStep[] = [
  {
    key: "layer-bar",
    title: "レイヤーバー",
    description:
      "レイヤーは水平 / 垂直に並ぶタブで切り替えます。クリックまたはショートカットで移動。",
  },
  {
    key: "canvas",
    title: "キャンバス",
    description: "中ドラッグでパン、Ctrl+ホイールでズーム。ミニマップで広いワークスペースを俯瞰。",
  },
  {
    key: "create-window",
    title: "新規ウィンドウ",
    description: "ここから terminal / iframe ウィンドウを作成。",
  },
  {
    key: "command-palette",
    title: "コマンドパレット",
    description: "Mod+K でコマンドパレット。全コマンドにアクセス。",
  },
];

const HIGHLIGHT_PADDING = 4;

function getTargetRect(key: string): DOMRect | null {
  const el = document.querySelector<HTMLElement>(`[data-tutorial="${key}"]`);
  return el ? el.getBoundingClientRect() : null;
}

function markTutorialSeen() {
  try {
    localStorage.setItem("ghovas.tutorialSeen", "true");
  } catch {
    // localStorage unavailable; proceed silently
  }
}

interface TutorialOverlayProps {
  onDone: () => void;
}

export function TutorialOverlay({ onDone }: TutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const step = STEPS[stepIndex]!;
  const isLast = stepIndex === STEPS.length - 1;

  const updateRect = useCallback(() => {
    setRect(getTargetRect(step.key));
  }, [step.key]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [updateRect]);

  useEffect(() => {
    overlayRef.current?.focus();
  }, [stepIndex]);

  const skip = useCallback(() => {
    markTutorialSeen();
    onDone();
  }, [onDone]);

  const handleNext = useCallback(() => {
    if (isLast) {
      markTutorialSeen();
      onDone();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [isLast, onDone]);

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      } else if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBack();
      }
    },
    [skip, handleNext, handleBack],
  );

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[200] bg-black/60 outline-none"
    >
      {rect && (
        <div
          className="absolute rounded border-2 border-primary pointer-events-none"
          style={{
            top: rect.top - HIGHLIGHT_PADDING,
            left: rect.left - HIGHLIGHT_PADDING,
            width: rect.width + HIGHLIGHT_PADDING * 2,
            height: rect.height + HIGHLIGHT_PADDING * 2,
          }}
        />
      )}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-80 bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-3 text-ink">
        <div className="flex items-center justify-between">
          <span className="text-muted text-[11px] font-mono">
            {stepIndex + 1} / {STEPS.length}
          </span>
          <span className="text-ink text-sm font-serif font-semibold">{step.title}</span>
        </div>
        <p className="m-0 text-body text-[13px] font-mono">{step.description}</p>
        <div className="flex justify-between items-center">
          <Button variant="ghost" onPress={handleBack} isDisabled={stepIndex === 0} className="!text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft size={14} aria-hidden /> Back
            </span>
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onPress={skip} className="!bg-surface-card !text-body-strong !border-hairline">
              Skip
            </Button>
            <Button variant="primary" onPress={handleNext}>
              {isLast ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check size={14} aria-hidden /> Done
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Next <ArrowRight size={14} aria-hidden />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
