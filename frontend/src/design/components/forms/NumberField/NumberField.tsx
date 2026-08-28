import type { CSSProperties, InputHTMLAttributes } from "react"
import { cx } from "@/utils/cx"
import { fieldWidth } from "@/utils/fieldWidth"
import styles from "./NumberField.module.scss"

/**
 * Numeric field with a unit label. Every timeout in nightcap is entered through this.
 */
export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "width" | "type"> {
  /** Unit suffix, e.g. "min" or "sec". */
  unit?: string
  width?: number | string
}

export function NumberField({
  value,
  onChange,
  unit,
  placeholder,
  min = 1,
  max,
  width = 92,
  disabled,
  className,
  style,
  ...rest
}: NumberFieldProps) {
  return (
    <label
      className={cx(styles.field, disabled && styles.disabled, className)}
      style={{ "--field-width": fieldWidth(width), ...style } as CSSProperties}
    >
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        {...rest}
      />
      {unit && <span className={styles.unit}>{unit}</span>}
    </label>
  )
}
