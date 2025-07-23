import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add bundle analyzer
    ...(process.env.ANALYZE === "true"
      ? [
          visualizer({
            filename: "dist/bundle-analysis.html",
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    // Basic optimization settings
    target: "esnext",
    minify: "esbuild", // Use esbuild for faster minification
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@headlessui/react", "@heroicons/react"],
          state: ["@reduxjs/toolkit", "react-redux"],
          query: ["@tanstack/react-query"],
        },
      },
    },
    // Set reasonable limits
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      "/v0": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
