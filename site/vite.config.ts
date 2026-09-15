import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The site is a second Vite app that shares one design system with the desktop
// frontend: "@" points at frontend/src, so `@/design/...` resolves to the very
// components the app ships rather than a copy.
export default defineConfig({
  // GitHub Pages serves this as a project site at /nightcap/. Assets in public/
  // must be referenced through import.meta.env.BASE_URL, never a leading slash.
  base: "/nightcap/",
  plugins: [react()],
  resolve: {
    // Keep in step with "paths" in tsconfig.json. Vite applies this alias to
    // Sass @use too, which is what makes `@use "@/design/styles/units"` inside
    // the shared .module.scss files resolve from here.
    alias: {
      "@": fileURLToPath(new URL("../frontend/src", import.meta.url)),
    },
    // The shared components live outside this root, so a bare `react` import
    // inside them can resolve to frontend/node_modules and give us two Reacts.
    dedupe: ["react", "react-dom"],
  },
  server: {
    // frontend/src is outside the Vite root; dev needs explicit permission to
    // serve from there. The build reads the filesystem directly and doesn't care.
    fs: { allow: [".."] },
  },
})
