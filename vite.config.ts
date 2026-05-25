import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
//
// Two HTML entries:
//   - index.html  → the browser-facing news app
//   - video.html  → a render-only page used by the Playwright recorder to
//     produce the 1080×1920 MP4. It is NOT meant to be visited by humans.
//
// `vite-plugin-singlefile` forces `output.inlineDynamicImports = true`,
// which Rollup rejects when there are multiple inputs. We therefore build
// each entry in its own pass, switching via the BUILD_TARGET env var.
// tools/build.mjs orchestrates the two passes; `npm run build` calls that.
export default defineConfig(() => {
  const target = process.env.BUILD_TARGET || "app";
  const entryFile =
    target === "video"
      ? path.resolve(__dirname, "video.html")
      : path.resolve(__dirname, "index.html");

  return {
    plugins: [react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      // Only the first pass clears dist/. The second pass writes alongside.
      emptyOutDir: target !== "video",
      rollupOptions: {
        input: entryFile,
      },
    },
    // Bind dev + preview servers to all network interfaces so phones on the
    // same Wi-Fi can hit http://<your-pc-ip>:5173/. `host: true` is the Vite
    // shorthand for 0.0.0.0 and makes the network URL print on startup.
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
  };
});
