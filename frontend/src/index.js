import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { UserProvider } from "@/context/UserContext";
import { LangProvider } from "@/context/LangContext";

// Suprimir erros inofensivos de condições de corrida no fetch
const _origError = console.error;
console.error = (...args) => {
  const msg = args[0]?.toString() || '';
  if (msg.includes('body stream already read')) return;
  if (msg.includes('PerformanceServerTiming')) return;
  _origError(...args);
};

// Suprimir também como erro não capturado (evita toast do Sonner)
window.addEventListener('unhandledrejection', (e) => {
  const msg = e?.reason?.message || '';
  if (msg.includes('body stream') || msg.includes('json') && msg.includes('Response')) {
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <LangProvider>
    <UserProvider>
      <App />
    </UserProvider>
  </LangProvider>,
);
