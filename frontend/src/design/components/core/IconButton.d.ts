import type { ButtonHTMLAttributes, JSX } from 'react'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Lucide icon name. */
  icon: string
  /** Required — becomes both aria-label and the native tooltip. */
  label: string
  /** Square edge length in px. 24 dense, 28 default, 32 titlebar. */
  size?: number
  variant?: 'ghost' | 'outlined' | 'danger' | 'close'
}

export function IconButton(props: IconButtonProps): JSX.Element
