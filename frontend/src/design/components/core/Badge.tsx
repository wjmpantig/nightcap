import type { HTMLAttributes } from "react"
import { Icon } from "./Icon"

/**
 * State pill. Tone is meaning, not decoration: one hue per state across the whole product.
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** awake = holding a wake lock · watched = armed · snoozed = paused · closed = terminated · locked = driver/service */
  tone?: "neutral" | "awake" | "watched" | "closed" | "snoozed" | "locked"
  /** Leading 5px status dot. */
  dot?: boolean
  /** Lucide icon name shown before the label. */
  icon?: string
  shape?: "pill" | "square"
}

const CSS = `
.nc-badge{display:inline-flex;align-items:center;gap:var(--space-2);height:20px;
  padding:0 var(--space-4);border-radius:var(--radius-pill);border:1px solid transparent;
  font:var(--type-label);letter-spacing:.02em;white-space:nowrap;text-transform:none}
.nc-badge--square{border-radius:var(--radius-xs);font-family:var(--font-mono);text-transform:none}
.nc-badge__dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex:0 0 auto}
`
const TONES = {
  neutral: { color: "var(--text-secondary)", bg: "var(--paper-a06)", border: "var(--line)" },
  awake: {
    color: "var(--state-awake)",
    bg: "var(--amber-a12)",
    border: "color-mix(in oklch,var(--state-awake) 28%,transparent)",
  },
  watched: {
    color: "var(--state-watched)",
    bg: "var(--moonlight-a08)",
    border: "var(--moonlight-a32)",
  },
  closed: {
    color: "var(--state-closed)",
    bg: "var(--ember-a12)",
    border: "color-mix(in oklch,var(--state-closed) 28%,transparent)",
  },
  snoozed: { color: "var(--state-snoozed)", bg: "transparent", border: "var(--line)" },
  locked: { color: "var(--state-locked)", bg: "transparent", border: "var(--line)" },
}
let injected = false
function inject() {
  if (injected || typeof document === "undefined") return
  injected = true
  const el = document.createElement("style")
  el.textContent = CSS
  document.head.appendChild(el)
}
inject()

export function Badge({
  tone = "neutral",
  dot = false,
  icon,
  shape = "pill",
  children,
  style,
  ...rest
}: BadgeProps) {
  const t = TONES[tone] || TONES.neutral
  return (
    <span
      className={`nc-badge${shape === "square" ? " nc-badge--square" : ""}`}
      style={{ color: t.color, background: t.bg, borderColor: t.border, ...style }}
      {...rest}
    >
      {dot && <i className="nc-badge__dot" />}
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}
