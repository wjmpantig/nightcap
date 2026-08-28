import type { HTMLAttributes } from "react"
import { Icon } from "@/design/components/core/Icon"

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
  style,
  ...rest
}: ProcessNameProps) {
  const shared = hosts.length > 1
  return (
    <div {...rest} style={{ minWidth: 0, ...style }}>
      <div
        style={{
          font: size === "sm" ? "var(--type-mono-sm)" : "var(--type-mono)",
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={path || exe}
      >
        {exe}
      </div>
      {hosts.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            font: "var(--type-small)",
            color: "var(--text-muted)",
            marginTop: 2,
          }}
        >
          {shared && <Icon name="git-fork" size={11} color="var(--state-locked)" />}
          <span>
            {shared ? "shared runtime, owned by " : "owned by "}
            {hosts.join(", ")}
          </span>
        </div>
      )}
    </div>
  )
}
