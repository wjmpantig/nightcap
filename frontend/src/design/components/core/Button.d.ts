import type { ButtonHTMLAttributes, JSX } from 'react'

/**
 * The one text button. Primary is moonlight-on-night and appears at most once per view;
 * destructive actions are the outlined danger variant, never a filled red block.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** Lucide icon name placed before the label. */
  icon?: string
  /** Lucide icon name placed after the label. */
  iconRight?: string
  block?: boolean
}

export function Button(props: ButtonProps): JSX.Element
