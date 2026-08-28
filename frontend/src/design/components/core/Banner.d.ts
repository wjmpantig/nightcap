import type { HTMLAttributes, JSX, ReactNode } from 'react'

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'warning' | 'error'
  title?: ReactNode
  /** Buttons rendered at the right edge. */
  action?: ReactNode
  onDismiss?: () => void
}

export function Banner(props: BannerProps): JSX.Element
