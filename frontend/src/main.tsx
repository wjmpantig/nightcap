import { createRoot } from "react-dom/client"
import "./style.scss"
import App from "./App"

// A blank window is the worst failure mode to debug: it looks identical whether
// the bundle never loaded, a module threw at import time, or React unmounted
// after an error. These traps make sure something legible always reaches the
// screen, even with no devtools open.
function showFatal(what: string, err: unknown) {
  const detail = err instanceof Error ? `${err.message}\n\n${err.stack ?? ""}` : String(err)
  const el = document.getElementById("root") ?? document.body
  el.innerHTML = ""
  const pre = document.createElement("pre")
  pre.style.cssText =
    "margin:24px;padding:16px;border:1px solid #f7768e;border-radius:8px;" +
    "color:#f7768e;background:#191c26;font:12px/1.5 monospace;white-space:pre-wrap;"
  pre.textContent = `nightcap failed to start (${what})\n\n${detail}`
  el.appendChild(pre)
}

window.addEventListener("error", (e) => showFatal("script error", e.error ?? e.message))
window.addEventListener("unhandledrejection", (e) => showFatal("unhandled rejection", e.reason))

try {
  const container = document.getElementById("root")
  if (!container) throw new Error("#root is missing from index.html")

  createRoot(container).render(
    // StrictMode is deliberately not used: it double-invokes effects, which
    // means two concurrent binding-readiness polls during startup.
    <App />,
  )
} catch (e) {
  showFatal("render", e)
}
