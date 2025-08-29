import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("React app starting...");

const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log("Creating React root...");
  root.render(<App />);
  console.log("React app rendered");
} else {
  console.error("Root element not found!");
}
