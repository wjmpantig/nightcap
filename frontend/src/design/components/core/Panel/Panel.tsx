import type { HTMLAttributes } from "react"
import { cx } from "../../../cx"
import styles from "./Panel.module.scss"

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  tone?: "default" | "sunken" | "accent" | "quiet"
  /** Set false when the panel holds a full-bleed list. */
  pad?: boolean
}

export function Panel({ tone = "default", pad = true, children, className, ...rest }: PanelProps) {
  return (
    <section {...rest} className={cx(styles.panel, styles[tone], pad && styles.pad, className)}>
      {children}
    </section>
  )
}
