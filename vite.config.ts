import { defineConfig } from "vite";

// Relative base so the static build also works on GitHub Pages sub-paths.
export default defineConfig({
  base: "./",
  server: { port: 5173 },
});
