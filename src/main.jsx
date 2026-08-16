import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// -----------------------------------------------------------------------
// Shim de window.storage: dentro de Claude esta API la provee la
// plataforma. Aquí, para que la app funcione como sitio propio, la
// implementamos sobre localStorage del navegador (misma interfaz).
// -----------------------------------------------------------------------
window.storage = {
  async get(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error(`key not found: ${key}`);
    return { key, value: raw, shared: false };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value, shared: false };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix) {
    const keys = Object.keys(localStorage).filter((k) => !prefix || k.startsWith(prefix));
    return { keys, prefix, shared: false };
  },
};

// Registro simple de service worker para que el navegador ofrezca "Instalar app"
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
