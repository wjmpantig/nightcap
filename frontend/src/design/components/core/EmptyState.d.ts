import type { HTMLAttributes, JSX, ReactNode } from 'react'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Lucide name. Defaults to "moon". */
  icon?: string
  title: ReactNode
  action?: ReactNode
}

export function EmptyState(props: EmptyStateProps): JSX.Element
