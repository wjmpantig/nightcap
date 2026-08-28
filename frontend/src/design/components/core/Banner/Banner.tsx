import type { HTMLAttributes, ReactNode } from "react"
import { cx } from "@/utils/cx"
import type { IconName } from "@/design/components/core/Icon"
import { Icon } from "@/design/components/core/Icon"
import { IconButton } from "@/design/components/core/IconButton"
import styles from "./Banner.module.scss"

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: "info" | "warning" | "error"
  title?: ReactNode
  /** Buttons rendered at the right edge. */
  action?: ReactNode
  onDismiss?: () => void
}

const ICONS: Record<NonNullable<BannerProps["tone"]>, IconName> = {
  info: "info",
  warning: "triangle-alert",
  error: "shield-alert",
}

export function Banner({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
  ...rest
}: BannerProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      {...rest}
      className={cx(styles.banner, styles[tone], className)}
    >
      <Icon name={ICONS[tone]} size={16} className={styles.icon} />
      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        {children && <div className={styles.text}>{children}</div>}
      </div>
      {action}
      {onDismiss && <IconButton icon="x" label="Dismiss" size={24} onClick={onDismiss} />}
    </div>
  )
}
