import type { InputHTMLAttributes, JSX, ReactNode } from 'react'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  /** Second line explaining the consequence of the setting. */
  hint?: ReactNode
}

export function Checkbox(props: CheckboxProps): JSX.Element
