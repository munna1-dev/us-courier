import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],

  root: path.resolve(
    process.cwd(),
    "frontend"
  ),

  publicDir: path.resolve(
    process.cwd(),
    "frontend/public"
  ),

  resolve: {
    alias: {
      "@": path.resolve(
        process.cwd(),
        "frontend/src"
      )
    }
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true
  },

  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true
  },

  build: {
    outDir: path.resolve(
      process.cwd(),
      "dist"
    ),
    emptyOutDir: true,
    sourcemap: false,

    rollupOptions: {
      input: path.resolve(
        process.cwd(),
        "frontend/index.html"
      )
    }
  }
});