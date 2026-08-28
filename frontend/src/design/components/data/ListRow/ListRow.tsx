import type { HTMLAttributes, ReactNode } from "react"
import { cx } from "@/utils/cx"
import styles from "./ListRow.module.scss"

export interface ListRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed-width status slot: a Badge, Mark or state dot. */
  leading?: ReactNode
  /** Right-aligned secondary text (timestamps, "after 22m idle"). */
  meta?: ReactNode
  /** Controls pinned to the right edge. */
  actions?: ReactNode
  selected?: boolean
  /** Dims the row — used for snoozed entries. */
  muted?: boolean
  interactive?: boolean
}

export function ListRow({
  leading,
  children,
  meta,
  actions,
  selected,
  muted,
  interactive = true,
  className,
  ...rest
}: ListRowProps) {
  return (
    <div
      {...rest}
      className={cx(
        styles.row,
        interactive && styles.interactive,
        selected && styles.selected,
        muted && styles.muted,
        className,
      )}
    >
      {leading}
      <div className={styles.body}>{children}</div>
      {meta && <div className={styles.meta}>{meta}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
