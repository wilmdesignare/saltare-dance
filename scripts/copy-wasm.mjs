// Copies the MediaPipe WASM runtime from node_modules into public/ so the app
// can run without loading code from a third-party CDN.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/@mediapipe/tasks-vision/wasm");
const dest = resolve(root, "public/mediapipe/wasm");

if (!existsSync(src)) {
  console.error("MediaPipe WASM not found. Run `npm install` first.");
  process.exit(1);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("Copied MediaPipe WASM to public/mediapipe/wasm");
