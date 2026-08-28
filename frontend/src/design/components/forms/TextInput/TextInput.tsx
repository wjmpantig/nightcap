import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react"
import type { IconName } from "@/design/components/core/Icon"
import { Icon } from "@/design/components/core/Icon"
import { cx } from "@/utils/cx"
import { fieldWidth } from "@/utils/fieldWidth"
import styles from "./TextInput.module.scss"

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "width"> {
  /** Lucide icon inside the field's left edge. */
  icon?: IconName
  /** Static trailing text, e.g. ".exe". */
  suffix?: ReactNode
  invalid?: boolean
  width?: number | string
}

export function TextInput({
  value,
  onChange,
  placeholder,
  icon,
  suffix,
  invalid,
  disabled,
  width,
  className,
  style,
  ...rest
}: TextInputProps) {
  return (
    <label
      className={cx(
        styles.field,
        invalid && styles.invalid,
        disabled && styles.disabled,
        className,
      )}
      style={{ "--field-width": fieldWidth(width), ...style } as CSSProperties}
    >
      {icon && <Icon name={icon} size={14} color="var(--text-muted)" />}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        {...rest}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </label>
  )
}
