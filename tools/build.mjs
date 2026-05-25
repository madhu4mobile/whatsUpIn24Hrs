#!/usr/bin/env node
/**
 * build.mjs
 *
 * Runs `vite build` twice — once with BUILD_TARGET=app (writes
 * dist/index.html) and once with BUILD_TARGET=video (writes
 * dist/video.html). Two passes are required because
 * vite-plugin-singlefile forces output.inlineDynamicImports = true,
 * which Rollup rejects when there's more than one Rollup input.
 *
 * Cross-platform: we use spawn + env so Windows PowerShell / cmd users
 * don't need cross-env.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function runVite(target) {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
    const child = spawn(cmd, ["vite", "build"], {
      cwd: projectRoot,
      stdio: "inherit",
      env: { ...process.env, BUILD_TARGET: target },
      // shell: true is required on Windows for .cmd shims to resolve.
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`vite build (target=${target}) exited ${code}`))
    );
  });
}

async function main() {
  console.log("[build] 1/2 building app (→ dist/index.html)…");
  await runVite("app");

  console.log("\n[build] 2/2 building video page (→ dist/video.html)…");
  await runVite("video");

  console.log("\n[build] ✓ both entries written to dist/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
