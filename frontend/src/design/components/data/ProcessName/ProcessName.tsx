import type { HTMLAttributes } from "react"
import { Icon } from "@/design/components/core/Icon"
import { cx } from "@/utils/cx"
import styles from "./ProcessName.module.scss"

/**
 * A process identity cell: mono executable name plus the owner chain nightcap resolved for it.
 */
export interface ProcessNameProps extends HTMLAttributes<HTMLDivElement> {
  /** Image name as powercfg reports it, e.g. "msedgewebview2.exe". */
  exe: string
  /** Owning applications resolved by walking the parent chain. Two or more = shared runtime. */
  hosts?: string[]
  /** Full image path — becomes the tooltip. */
  path?: string
  size?: "sm" | "md"
}

export function ProcessName({
  exe,
  hosts = [],
  path,
  size = "md",
  className,
  ...rest
}: ProcessNameProps) {
  const shared = hosts.length > 1
  return (
    <div {...rest} className={cx(styles.wrap, size === "sm" && styles.sm, className)}>
      <div className={styles.exe} title={path || exe}>
        {exe}
      </div>
      {hosts.length > 0 && (
        <div className={styles.owners}>
          {shared && <Icon name="git-fork" size={11} className={styles.forked} />}
          <span>
            {shared ? "shared runtime, owned by " : "owned by "}
            {hosts.join(", ")}
          </span>
        </div>
      )}
    </div>
  )
}
