import type { InputHTMLAttributes, JSX } from 'react'

/**
 * Numeric field with a unit label. Every timeout in nightcap is entered through this.
 */
export interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'width' | 'type'> {
  /** Unit suffix, e.g. "min" or "sec". */
  unit?: string
  width?: number | string
}

export function NumberField(props: NumberFieldProps): JSX.Element
