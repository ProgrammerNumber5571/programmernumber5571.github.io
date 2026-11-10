import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { initLiquidGlass } from "./lib/liquidGlass.js";
import { initAutoLite } from "./lib/autoLite.js";
import { initUpdateCheck } from "./lib/updateCheck.js";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
initLiquidGlass();
initAutoLite();
initUpdateCheck();

// While the page scrolls under a resting pointer, every card passing beneath it would fire hover
// (re-render, slide and spin its disc) dozens of times a second. Switch card hover off for the
// duration of the scroll (see "is-scrolling" in index.css); wheel scrolling over a card still works.
{
  const root = document.documentElement;
  let timer = 0;
  window.addEventListener(
    'scroll',
    () => {
      if (!timer) root.classList.add('is-scrolling');
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = 0;
        root.classList.remove('is-scrolling');
      }, 140);
    },
    { passive: true }
  );
}
