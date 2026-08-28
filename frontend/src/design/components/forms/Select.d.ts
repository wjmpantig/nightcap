import type { JSX, SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'width'> {
  options: SelectOption[]
  /** Rendered as an empty-value first option — used for action menus like "Snooze…". */
  placeholder?: string
  width?: number | string
}

export function Select(props: SelectProps): JSX.Element
