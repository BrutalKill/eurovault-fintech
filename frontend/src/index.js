import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { UserProvider } from "@/context/UserContext";
import { LangProvider } from "@/context/LangContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <LangProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </LangProvider>
  </React.StrictMode>,
);
