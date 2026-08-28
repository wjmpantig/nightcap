import type { HTMLAttributes, JSX } from 'react'

export interface CountdownRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Seconds left. */
  remaining: number
  /** Seconds the countdown started from (the configured warning window). */
  total: number
  size?: number
  /** Stroke colour. Defaults to --state-closed. */
  tone?: string
}

export function CountdownRing(props: CountdownRingProps): JSX.Element
