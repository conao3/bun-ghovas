const CONFIRM_WINDOW_CLOSE_KEY = "ghovas.confirm-window-close";

export function loadConfirmWindowClose(): boolean {
  try {
    const raw = localStorage.getItem(CONFIRM_WINDOW_CLOSE_KEY);
    if (raw === "false") return false;
    return true;
  } catch {
    return true;
  }
}

export function saveConfirmWindowClose(value: boolean): void {
  try {
    localStorage.setItem(CONFIRM_WINDOW_CLOSE_KEY, String(value));
  } catch {
    // localStorage unavailable; proceed silently
  }
}
