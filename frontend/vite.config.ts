import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Keep in step with "paths" in tsconfig.json — Vite resolves the build,
    // tsc resolves the types, and they have to agree.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
