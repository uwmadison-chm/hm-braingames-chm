import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { redirectHomeOnRefresh } from "./lib/refresh.ts";

redirectHomeOnRefresh();

createRoot(document.getElementById("root")!).render(<App />);
