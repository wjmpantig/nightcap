import type { InputHTMLAttributes, ReactNode } from "react"
import { Icon } from "@/design/components/core/Icon"
import { cx } from "@/utils/cx"
import styles from "./Checkbox.module.scss"

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  /** Second line explaining the consequence of the setting. */
  hint?: ReactNode
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
  className,
  ...rest
}: CheckboxProps) {
  return (
    <label className={cx(styles.check, disabled && styles.disabled, className)}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className={styles.box}>{checked && <Icon name="check" size={11} />}</span>
      <span>
        {label}
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </label>
  )
}
