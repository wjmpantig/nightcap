import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react"
import type { IconName } from "@/design/components/core/Icon"
import { Icon } from "@/design/components/core/Icon"
import { cx } from "@/utils/cx"
import styles from "./Button.module.scss"

/**
 * The one text button. Primary is moonlight-on-night and appears at most once per view;
 * destructive actions are the outlined danger variant, never a filled red block.
 *
 * Pass `href` and it renders an <a> wearing the same clothes — for the website, where a
 * download has to be a real link you can copy, open in a tab, or hand to a crawler. The
 * desktop app never passes it: a real navigation inside the Wails webview would replace
 * the window, which is what BrowserOpenURL is for.
 */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel" | "download"> {
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
  href,
  children,
  className,
  ...rest
}: ButtonProps) {
  const glyph = size === "sm" ? 13 : 15
  const classes = cx(
    styles.btn,
    styles[variant],
    size !== "md" && styles[size],
    block && styles.block,
    className,
  )
  const body = (
    <>
      {icon && <Icon name={icon} size={glyph} />}
      {children}
      {iconRight && <Icon name={iconRight} size={glyph} />}
    </>
  )

  if (href) {
    return (
      <a href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {body}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...rest}>
      {body}
    </button>
  )
}
