import type { CSSProperties, HTMLAttributes } from "react"
import { cx } from "@/utils/cx"
import styles from "./CountdownRing.module.scss"

export interface CountdownRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Seconds left. */
  remaining: number
  /** Seconds the countdown started from (the configured warning window). */
  total: number
  size?: number
  /** Stroke colour. Defaults to --state-closed. */
  tone?: string
}

export function CountdownRing({
  remaining,
  total,
  size = 84,
  tone = "var(--state-closed)",
  className,
  style,
  ...rest
}: CountdownRingProps) {
  const r = size / 2 - 4
  const circumference = 2 * Math.PI * r
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const secs = Math.max(0, Math.round(remaining))
  return (
    <div
      {...rest}
      className={cx(styles.ring, className)}
      style={{ "--ring-size": `${size}px`, "--ring-tone": tone, ...style } as CSSProperties}
    >
      <svg
        aria-hidden="true"
        className={styles.svg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="3"
        />
        <circle
          className={styles.arc}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - frac)}
        />
      </svg>
      <div className={styles.readout}>
        <span className={styles.secs}>{secs}</span>
        <span className={styles.unit}>sec</span>
      </div>
    </div>
  )
}
