import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./App.tsx";
import "./index.css";

// Detect search engine crawlers to disable animations (they snapshot opacity:0)
const isBot = /bot|crawl|spider|google|baidu|bing|msn|yandex|duckduck|facebookexternalhit|twitterbot|linkedinbot|slurp/i.test(
  navigator.userAgent
);

createRoot(document.getElementById("root")!).render(
  <MotionConfig reducedMotion={isBot ? "always" : "never"}>
    <App />
  </MotionConfig>
);
