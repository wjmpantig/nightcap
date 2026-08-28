import type { ReactNode } from "react"
import { Mark } from "@/design/components/brand/Mark"
import { Badge } from "@/design/components/core/Badge"
import type { IconName } from "@/design/components/core/Icon"
import { Icon } from "@/design/components/core/Icon"
import { mmss } from "@/format"

interface TrayMenuProps {
  paused: boolean
  idleSecs: number
  watching: number
  onTogglePause: () => void
  onOpen: () => void
}

interface TrayItemProps {
  icon: IconName
  children: ReactNode
  meta?: ReactNode
  onClick?: () => void
  danger?: boolean
}

function TrayItem({ icon, children, meta, onClick, danger }: TrayItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        width: "100%",
        height: 30,
        padding: "0 var(--space-5)",
        border: 0,
        background: "transparent",
        color: danger ? "var(--danger)" : "var(--text-primary)",
        font: "var(--type-body)",
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon name={icon} size={14} color="var(--text-muted)" />
      {children}
      {meta && (
        <span
          style={{ marginLeft: "auto", font: "var(--type-mono-sm)", color: "var(--text-muted)" }}
        >
          {meta}
        </span>
      )}
    </button>
  )
}

export function TrayMenu({ paused, idleSecs, watching, onTogglePause, onOpen }: TrayMenuProps) {
  return (
    <div
      style={{
        position: "absolute",
        right: 14,
        bottom: 14,
        zIndex: 30,
        width: 258,
        padding: "var(--space-3) 0",
        background: "var(--surface-raised)",
        border: "1px solid var(--line-strong)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-overlay)",
        animation: "fade var(--dur-fast) var(--ease-out)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          padding: "var(--space-3) var(--space-5) var(--space-5)",
        }}
      >
        <Mark
          size={18}
          state={paused ? "inactive" : "active"}
          style={{ color: paused ? "var(--state-snoozed)" : "var(--moonlight)" }}
        />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
          }}
        >
          nightcap
        </span>
        {paused ? (
          <Badge tone="snoozed">paused</Badge>
        ) : (
          <Badge tone="watched" style={{ marginLeft: "auto" }}>
            {watching} watched
          </Badge>
        )}
      </div>
      <div style={{ height: 1, background: "var(--line)", margin: "0 0 var(--space-3)" }} />
      <TrayItem icon="clock" meta={mmss(idleSecs)}>
        Idle
      </TrayItem>
      <TrayItem icon={paused ? "play" : "pause"} onClick={onTogglePause}>
        {paused ? "Resume watching" : "Pause watching"}
      </TrayItem>
      <TrayItem icon="app-window" onClick={onOpen}>
        Open nightcap
      </TrayItem>
      <div style={{ height: 1, background: "var(--line)", margin: "var(--space-3) 0" }} />
      <TrayItem icon="log-out" danger>
        Quit
      </TrayItem>
    </div>
  )
}
