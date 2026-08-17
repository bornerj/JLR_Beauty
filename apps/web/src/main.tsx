import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";
import "./styles/tailwind.react.patch.css";
import "./styles/legacy.css";
import "./styles/tailwind.generated.css";
import App from "./app/App";
import { initSessionKeepAlive } from "./lib/auth";

initSessionKeepAlive();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
