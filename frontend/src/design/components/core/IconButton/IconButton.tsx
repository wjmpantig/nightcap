import type { ButtonHTMLAttributes, CSSProperties } from "react"
import { cx } from "../../../cx"
import type { IconName } from "../Icon"
import { Icon } from "../Icon"
import styles from "./IconButton.module.scss"

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Lucide icon name. */
  icon: IconName
  /** Required — becomes both aria-label and the native tooltip. */
  label: string
  /** Square edge length in px. 24 dense, 28 default, 32 titlebar. */
  size?: number
  variant?: "ghost" | "outlined" | "danger" | "close"
}

export function IconButton({
  icon,
  label,
  size = 28,
  variant = "ghost",
  className,
  style,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(styles.iconbtn, styles[variant], className)}
      style={{ "--iconbtn-size": `${size}px`, ...style } as CSSProperties}
      {...rest}
    >
      <Icon name={icon} size={Math.round(size * 0.56)} />
    </button>
  )
}
