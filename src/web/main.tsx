import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { applyTheme, getStoredTheme } from "./lib/theme";

applyTheme(getStoredTheme());

const container = document.getElementById("app");
if (!container) throw new Error("#app element not found");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
