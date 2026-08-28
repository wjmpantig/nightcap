import type { HTMLAttributes, JSX } from 'react'

/**
 * State pill. Tone is meaning, not decoration: one hue per state across the whole product.
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** awake = holding a wake lock · watched = armed · snoozed = paused · closed = terminated · locked = driver/service */
  tone?: 'neutral' | 'awake' | 'watched' | 'closed' | 'snoozed' | 'locked'
  /** Leading 5px status dot. */
  dot?: boolean
  /** Lucide icon name shown before the label. */
  icon?: string
  shape?: 'pill' | 'square'
}

export function Badge(props: BadgeProps): JSX.Element
