import type { InputHTMLAttributes, JSX, ReactNode } from 'react'

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'width'> {
  /** Lucide icon inside the field's left edge. */
  icon?: string
  /** Static trailing text, e.g. ".exe". */
  suffix?: ReactNode
  invalid?: boolean
  width?: number | string
}

export function TextInput(props: TextInputProps): JSX.Element
