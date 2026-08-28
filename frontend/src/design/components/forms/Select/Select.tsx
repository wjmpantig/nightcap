import type { CSSProperties, SelectHTMLAttributes } from "react"
import { Icon } from "@/design/components/core/Icon"
import { cx } from "@/utils/cx"
import { fieldWidth } from "@/utils/fieldWidth"
import styles from "./Select.module.scss"

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "width"> {
  options: SelectOption[]
  /** Rendered as an empty-value first option — used for action menus like "Snooze…". */
  placeholder?: string
  width?: number | string
}

export function Select({
  value,
  onChange,
  options = [],
  placeholder,
  width,
  disabled,
  className,
  style,
  ...rest
}: SelectProps) {
  return (
    <div
      className={cx(styles.select, disabled && styles.disabled, className)}
      style={{ "--field-width": fieldWidth(width), ...style } as CSSProperties}
    >
      <select value={value} onChange={onChange} disabled={disabled} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon className={styles.chevron} name="chevron-down" size={13} />
    </div>
  )
}
