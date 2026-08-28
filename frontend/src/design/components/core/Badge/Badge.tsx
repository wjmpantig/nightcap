import type { HTMLAttributes } from "react"
import type { IconName } from "@/design/components/core/Icon"
import { Icon } from "@/design/components/core/Icon"
import { cx } from "@/utils/cx"
import styles from "./Badge.module.scss"

/**
 * State pill. Tone is meaning, not decoration: one hue per state across the whole product.
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** awake = holding a wake lock · watched = armed · snoozed = paused · closed = terminated · locked = driver/service */
  tone?: "neutral" | "awake" | "watched" | "closed" | "snoozed" | "locked"
  /** Leading 5px status dot. */
  dot?: boolean
  /** Lucide icon name shown before the label. */
  icon?: IconName
  shape?: "pill" | "square"
}

export function Badge({
  tone = "neutral",
  dot = false,
  icon,
  shape = "pill",
  children,
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cx(styles.badge, styles[tone], shape === "square" && styles.square, className)}
      {...rest}
    >
      {dot && <i className={styles.dot} />}
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}
