import type { HTMLAttributes } from "react"

export interface IdleMeterProps extends HTMLAttributes<HTMLDivElement> {
  /** Seconds since the last keyboard or mouse input. */
  idleSecs: number
  /** The timeout this meter is filling toward. */
  timeoutMinutes: number
  label?: string
}

function mmss(secs: number) {
  const s = Math.max(0, Math.round(secs))
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
}

export function IdleMeter({
  idleSecs,
  timeoutMinutes,
  label = "Idle",
  style,
  ...rest
}: IdleMeterProps) {
  const total = timeoutMinutes * 60
  const frac = total > 0 ? Math.max(0, Math.min(1, idleSecs / total)) : 0
  const near = frac > 0.75
  return (
    <div
      {...rest}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        minWidth: 180,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-4)" }}>
        <span
          style={{
            font: "var(--type-label)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-label)",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            font: "var(--type-mono)",
            color: near ? "var(--state-awake)" : "var(--text-primary)",
          }}
        >
          {mmss(idleSecs)}
        </span>
        <span
          style={{ marginLeft: "auto", font: "var(--type-mono-sm)", color: "var(--text-muted)" }}
        >
          / {timeoutMinutes}m
        </span>
      </div>
      <div
        style={{
          height: 3,
          borderRadius: "var(--radius-pill)",
          background: "var(--night-700)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(frac * 100).toFixed(2)}%`,
            height: "100%",
            background: near ? "var(--state-awake)" : "var(--accent)",
            transition: "width var(--dur-tick) linear, background var(--dur-base) var(--ease-out)",
          }}
        />
      </div>
    </div>
  )
}
