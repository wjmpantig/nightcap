import type { ButtonHTMLAttributes } from "react"
import { cx } from "../../../cx"
import type { IconName } from "../Icon"
import { Icon } from "../Icon"
import styles from "./Button.module.scss"

/**
 * The one text button. Primary is moonlight-on-night and appears at most once per view;
 * destructive actions are the outlined danger variant, never a filled red block.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  /** Lucide icon name placed before the label. */
  icon?: IconName
  /** Lucide icon name placed after the label. */
  iconRight?: IconName
  block?: boolean
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  block = false,
  children,
  className,
  ...rest
}: ButtonProps) {
  const glyph = size === "sm" ? 13 : 15
  return (
    <button
      type="button"
      className={cx(
        styles.btn,
        styles[variant],
        size !== "md" && styles[size],
        block && styles.block,
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={glyph} />}
      {children}
      {iconRight && <Icon name={iconRight} size={glyph} />}
    </button>
  )
}
