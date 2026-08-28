import type { HTMLAttributes, JSX } from 'react'

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /** Lucide icon name in kebab-case, e.g. "moon", "eye", "circle-slash". */
  name: string
  /** Pixel box. 14 in dense rows, 16 default, 20 in headers. */
  size?: number
  /** Any CSS colour. Defaults to currentColor. */
  color?: string
}

export function Icon(props: IconProps): JSX.Element
