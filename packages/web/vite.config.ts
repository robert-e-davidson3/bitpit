import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [
    checker({
      typescript: true,
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      external: (id) => {
        // Don't externalize workspace dependencies
        if (id.includes("@bitpit/")) return false;
        return false;
      },
    },
  },
  server: {
    hmr: {
      overlay: true,
    },
  },
});
