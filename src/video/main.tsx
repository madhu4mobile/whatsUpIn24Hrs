import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import VideoApp from "./VideoApp";

const root = document.getElementById("video-root");
if (!root) {
  throw new Error("video.html is missing <div id=\"video-root\"></div>");
}
createRoot(root).render(
  <StrictMode>
    <VideoApp />
  </StrictMode>
);
