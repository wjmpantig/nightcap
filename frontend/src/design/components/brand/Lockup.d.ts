import type { HTMLAttributes, JSX } from 'react'

/**
 * Horizontal lockup: mark + "nightcap" wordmark in Space Grotesk Medium at -0.035em.
 */
export interface LockupProps extends HTMLAttributes<HTMLDivElement> {
  /** Wordmark font-size in px; the mark scales from it. */
  size?: number
  variant?: 'solid' | 'duotone' | 'outline'
  /** Optional second line, sentence case, no period. */
  tagline?: string
}

export function Lockup(props: LockupProps): JSX.Element
