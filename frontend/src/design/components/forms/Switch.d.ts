import type { InputHTMLAttributes, JSX, ReactNode } from 'react'

export interface SwitchProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  /** amber marks a switch whose ON state means "nightcap is not protecting your sleep". */
  tone?: 'accent' | 'amber'
}

export function Switch(props: SwitchProps): JSX.Element
