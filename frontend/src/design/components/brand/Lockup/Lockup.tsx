import type { CSSProperties, HTMLAttributes } from "react"
import { cx } from "../../../cx"
import { Mark } from "../Mark"
import styles from "./Lockup.module.scss"

/**
 * Horizontal lockup: mark + "nightcap" wordmark in Space Grotesk Medium at -0.035em.
 */
export interface LockupProps extends HTMLAttributes<HTMLDivElement> {
  /** Wordmark font-size in px; the mark and the gap scale from it. */
  size?: number
  variant?: "solid" | "duotone" | "outline"
  /** Optional second line, sentence case, no period. */
  tagline?: string
}

export function Lockup({
  size = 22,
  variant = "solid",
  tagline,
  className,
  style,
  ...rest
}: LockupProps) {
  return (
    <div
      {...rest}
      className={cx(styles.lockup, className)}
      style={{ "--lockup-size": `${size}px`, ...style } as CSSProperties}
    >
      <Mark size={size * 1.15} variant={variant} title="nightcap" />
      <div className={styles.text}>
        <span className={styles.word}>nightcap</span>
        {tagline && <span className={styles.tagline}>{tagline}</span>}
      </div>
    </div>
  )
}
