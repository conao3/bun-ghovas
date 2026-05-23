import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { ToastProvider } from "./lib/toast";

const devEvents = new EventSource("/dev-events");
devEvents.onmessage = () => location.reload();

const container = document.getElementById("app");
if (!container) throw new Error("#app element not found");

createRoot(container).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
