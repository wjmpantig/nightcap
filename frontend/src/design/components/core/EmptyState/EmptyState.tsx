import type { HTMLAttributes, ReactNode } from "react"
import { cx } from "@/utils/cx"
import type { IconName } from "@/design/components/core/Icon"
import { Icon } from "@/design/components/core/Icon"
import styles from "./EmptyState.module.scss"

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Lucide name. Defaults to "moon". */
  icon?: IconName
  title: ReactNode
  action?: ReactNode
}

export function EmptyState({
  icon = "moon",
  title,
  children,
  action,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div {...rest} className={cx(styles.empty, className)}>
      <Icon name={icon} size={22} className={styles.icon} />
      <div className={styles.title}>{title}</div>
      {children && <div className={styles.detail}>{children}</div>}
      {action}
    </div>
  )
}
