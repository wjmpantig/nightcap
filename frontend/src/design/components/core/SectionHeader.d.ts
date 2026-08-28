import type { HTMLAttributes, JSX, ReactNode } from 'react'

export interface SectionHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Sentence-case label; rendered uppercase with 0.08em tracking. */
  title: string
  /** Row count, shown in mono next to the title. */
  count?: number | string
  hint?: ReactNode
  /** Buttons pushed to the right edge. */
  actions?: ReactNode
}

export function SectionHeader(props: SectionHeaderProps): JSX.Element
