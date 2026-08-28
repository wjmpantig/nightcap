import type { HTMLAttributes, JSX } from 'react'

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  tone?: 'default' | 'sunken' | 'accent' | 'quiet'
  /** Set false when the panel holds a full-bleed list. */
  pad?: boolean
}

export function Panel(props: PanelProps): JSX.Element
