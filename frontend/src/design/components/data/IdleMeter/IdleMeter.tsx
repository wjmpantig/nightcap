import type { CSSProperties, HTMLAttributes } from "react"
import { mmss } from "@/format"
import { cx } from "@/utils/cx"
import styles from "./IdleMeter.module.scss"

export interface IdleMeterProps extends HTMLAttributes<HTMLDivElement> {
  /** Seconds since the last keyboard or mouse input. */
  idleSecs: number
  /** The timeout this meter is filling toward. */
  timeoutMinutes: number
  label?: string
}

export function IdleMeter({
  idleSecs,
  timeoutMinutes,
  label = "Idle",
  className,
  style,
  ...rest
}: IdleMeterProps) {
  const total = timeoutMinutes * 60
  const frac = total > 0 ? Math.max(0, Math.min(1, idleSecs / total)) : 0
  const near = frac > 0.75
  return (
    <div
      {...rest}
      className={cx(styles.meter, near && styles.near, className)}
      style={{ "--fill": `${(frac * 100).toFixed(2)}%`, ...style } as CSSProperties}
    >
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{mmss(idleSecs)}</span>
        <span className={styles.of}>/ {timeoutMinutes}m</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} />
      </div>
    </div>
  )
}
