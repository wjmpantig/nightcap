import type { ReactNode } from "react"
import { Panel } from "@/design/components/core/Panel"
import { SectionHeader } from "@/design/components/core/SectionHeader"
import { Checkbox } from "@/design/components/forms/Checkbox"
import { NumberField } from "@/design/components/forms/NumberField"
import { Switch } from "@/design/components/forms/Switch"
import type { Settings } from "@/types"

interface SettingsViewProps {
  cfg: Settings
  onChange: (patch: Partial<Settings>) => void
}

interface SettingProps {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
}

function Setting({ label, hint, children }: SettingProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-6)",
        padding: "var(--space-5) 0",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "var(--type-body-strong)" }}>{label}</div>
        {hint && (
          <div
            style={{
              font: "var(--type-small)",
              color: "var(--text-muted)",
              marginTop: 2,
              maxWidth: 440,
            }}
          >
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

export function SettingsView({ cfg, onChange }: SettingsViewProps) {
  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: "var(--gap-section)" }}
    >
      <Panel pad={false}>
        <SectionHeader title="Rules" />
        <div style={{ padding: "0 var(--pad-panel) var(--space-4)" }}>
          <Setting
            label="Close watched apps after"
            hint="Time with no keyboard or mouse input before a watched app is terminated."
          >
            <NumberField
              value={cfg.defaultTimeoutMinutes}
              unit="min"
              onChange={(e) => onChange({ defaultTimeoutMinutes: Number(e.target.value) || 1 })}
            />
          </Setting>
          <Setting
            label="Warn first for"
            hint="The countdown you get to cancel or snooze. Set to 0 to close without warning."
          >
            <NumberField
              value={cfg.warningSeconds}
              unit="sec"
              min={0}
              onChange={(e) => onChange({ warningSeconds: Number(e.target.value) || 0 })}
            />
          </Setting>
        </div>
      </Panel>

      <Panel pad={false}>
        <SectionHeader title="Startup and state" />
        <div
          style={{
            padding: "var(--space-6) var(--pad-panel)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-6)",
          }}
        >
          <Checkbox
            checked={cfg.autostart}
            onChange={(e) => onChange({ autostart: e.target.checked })}
            label="Start nightcap at login"
            hint="Registers a scheduled task with highest privileges — a Run key cannot launch an elevated app."
          />
          <Switch
            checked={cfg.paused}
            tone="amber"
            onChange={(e) => onChange({ paused: e.target.checked })}
            label="Pause watching"
          />
          <div style={{ font: "var(--type-small)", color: "var(--text-muted)", marginTop: -8 }}>
            Nothing is closed while paused. The watchlist is kept. Also available in the tray menu.
          </div>
        </div>
      </Panel>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-5)",
          font: "var(--type-small)",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)" }}>%APPDATA%\nightcap\config.json</span>
      </div>
    </div>
  )
}
