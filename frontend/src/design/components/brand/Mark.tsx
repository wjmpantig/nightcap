import type { SVGAttributes } from "react"
import { useId } from "react"

/**
 * The nightcap mark — a moon setting behind a horizon bar. Geometry is fixed; never redraw it.
 */
export interface MarkProps extends SVGAttributes<SVGSVGElement> {
  /** Pixel box. Minimum 16 in a tray, 20 anywhere else. */
  size?: number
  /** solid inherits currentColor · duotone is moonlight disc + amber horizon · outline is a hollow moon. */
  variant?: "solid" | "duotone" | "outline"
  /** inactive sinks the moon to a sliver — used for "paused" / dimmed tray states. */
  state?: "active" | "inactive"
  /** Supplying a title makes it an accessible image instead of decoration. */
  title?: string
}

// Geometry copied verbatim from assets/svg/nightcap-mark.svg (mark 2b "Moonset"):
// disc r=38 at cy=57 clipped at y=75, horizon bar 94x10 r=5 at y=70.
// The inactive state sinks the moon to a sliver (assets/svg/state-inactive.svg).
export function Mark({
  size = 24,
  variant = "solid",
  state = "active",
  title,
  style,
  ...rest
}: MarkProps) {
  const id = useId().replace(/:/g, "")
  const active = state === "active"
  const clipH = active ? 75 : 58
  const cy = active ? 57 : 76
  const barY = active ? 70 : 53
  const discFill = variant === "duotone" ? "var(--moonlight)" : "currentColor"
  const barFill = variant === "duotone" ? "var(--amber)" : "currentColor"
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-label={title}
      style={style}
      {...rest}
    >
      {title && <title>{title}</title>}
      <clipPath id={id}>
        <rect x="0" y="0" width="100" height={clipH} />
      </clipPath>
      {variant === "outline" ? (
        <circle
          cx="50"
          cy={cy}
          r="33.5"
          fill="none"
          stroke={discFill}
          strokeWidth="9"
          clipPath={`url(#${id})`}
        />
      ) : (
        <circle cx="50" cy={cy} r="38" fill={discFill} clipPath={`url(#${id})`} />
      )}
      <rect x="3" y={barY} width="94" height="10" rx="5" fill={barFill} />
    </svg>
  )
}
