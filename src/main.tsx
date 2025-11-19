import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('main.tsx: Script loaded');
console.log('main.tsx: Document ready state:', document.readyState);
console.log('main.tsx: window.electronAPI:', window.electronAPI);

const rootElement = document.getElementById("root");
console.log('main.tsx: rootElement:', rootElement);

if (!rootElement) {
  throw new Error('Root element not found!');
}

console.log('main.tsx: Creating React root...');
const root = ReactDOM.createRoot(rootElement);
console.log('main.tsx: Rendering App...');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
console.log('main.tsx: Render complete');

