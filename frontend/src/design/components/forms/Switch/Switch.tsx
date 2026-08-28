import type { InputHTMLAttributes, ReactNode } from "react"
import { cx } from "@/utils/cx"
import styles from "./Switch.module.scss"

export interface SwitchProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  /** amber marks a switch whose ON state means "nightcap is not protecting your sleep". */
  tone?: "accent" | "amber"
}

export function Switch({
  checked,
  onChange,
  label,
  tone = "accent",
  disabled,
  className,
  ...rest
}: SwitchProps) {
  return (
    <label
      className={cx(
        styles.switch,
        tone === "amber" && styles.amber,
        disabled && styles.disabled,
        className,
      )}
    >
      <input
        type="checkbox"
        role="switch"
        aria-checked={!!checked}
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className={styles.track}>
        <span className={styles.knob} />
      </span>
      {label}
    </label>
  )
}
