import type { HTMLAttributes, ReactNode } from "react"
import { cx } from "@/utils/cx"
import styles from "./SectionHeader.module.scss"

export interface SectionHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Sentence-case label; rendered uppercase with 0.08em tracking. */
  title: string
  /**
   * Row count, shown in mono next to the title. A count of 0 is omitted
   * rather than rendered as a bare "0" chip — the empty state below already
   * says there is nothing here, and every view that passes a count showed the
   * zero.
   */
  count?: number | string
  hint?: ReactNode
  /** Buttons pushed to the right edge. */
  actions?: ReactNode
}

export function SectionHeader({
  title,
  count,
  hint,
  actions,
  className,
  ...rest
}: SectionHeaderProps) {
  return (
    <header {...rest} className={cx(styles.header, className)}>
      <h2 className={styles.title}>{title}</h2>
      {count != null && count !== 0 && <span className={styles.count}>{count}</span>}
      {hint && <span className={styles.hint}>{hint}</span>}
      <div className={styles.actions}>{actions}</div>
    </header>
  )
}
