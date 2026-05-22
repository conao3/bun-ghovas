import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const container = document.getElementById("app");
if (!container) throw new Error("#app element not found");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
