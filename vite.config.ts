import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/' : '/s/lucida/braingames/',
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  }, 
  // The Pig client starts a web worker, which Vite's dev pre-bundling loses track of.
  optimizeDeps: {
    exclude: ["@uwmadison-chm/pig-client"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
