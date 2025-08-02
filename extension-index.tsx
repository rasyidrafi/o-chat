import React from "react";
import ReactDOM from "react-dom/client";
import ExtensionApp from "./ExtensionApp";

// Extension-specific initialization
console.log("O-Chat Extension initializing...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ExtensionApp />
  </React.StrictMode>
);