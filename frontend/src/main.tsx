import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/global.css";
import "./styles/app.css";

const root =
  document.getElementById("root");

if (!root) {
  throw new Error(
    "Application root was not found."
  );
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);