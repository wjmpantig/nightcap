import type { HTMLAttributes, JSX, ReactNode } from 'react'

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

export function ListRow(props: ListRowProps): JSX.Element
