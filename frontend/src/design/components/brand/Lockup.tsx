import type { HTMLAttributes } from "react"
import { Mark } from "./Mark"

/**
 * Horizontal lockup: mark + "nightcap" wordmark in Space Grotesk Medium at -0.035em.
 */
export interface LockupProps extends HTMLAttributes<HTMLDivElement> {
  /** Wordmark font-size in px; the mark scales from it. */
  size?: number
  variant?: "solid" | "duotone" | "outline"
  /** Optional second line, sentence case, no period. */
  tagline?: string
}

export function Lockup({ size = 22, variant = "solid", tagline, style, ...rest }: LockupProps) {
  return (
    <div
      {...rest}
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.42, ...style }}
    >
      <Mark size={size * 1.15} variant={variant} title="nightcap" />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: "var(--weight-medium)",
            fontSize: size,
            lineHeight: 1,
            letterSpacing: "var(--tracking-display)",
            color: "var(--text-primary)",
          }}
        >
          nightcap
        </span>
        {tagline && (
          <span
            style={{
              font: "var(--type-small)",
              color: "var(--text-muted)",
              letterSpacing: "var(--tracking-normal)",
            }}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  )
}
