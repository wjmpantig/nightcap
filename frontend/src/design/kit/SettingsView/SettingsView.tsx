import type { ReactNode } from "react"
import { Panel } from "@/design/components/core/Panel"
import { SectionHeader } from "@/design/components/core/SectionHeader"
import { Checkbox } from "@/design/components/forms/Checkbox"
import { NumberField } from "@/design/components/forms/NumberField"
import { Switch } from "@/design/components/forms/Switch"
import type { Settings } from "@/types"
import { cx } from "@/utils/cx"
import styles from "./SettingsView.module.scss"

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
    <div className={styles.setting}>
      <div className={styles.settingText}>
        <div className={styles.settingLabel}>{label}</div>
        {hint && <div className={styles.settingHint}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

export function SettingsView({ cfg, onChange }: SettingsViewProps) {
  return (
    <div className={cx("fade-in", styles.view)}>
      <Panel pad={false}>
        <SectionHeader title="Rules" />
        <div className={styles.rules}>
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
        <div className={styles.startup}>
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
          <div className={styles.pauseNote}>
            Nothing is closed while paused. The watchlist is kept. Also available in the tray menu.
          </div>
        </div>
      </Panel>

      <div className={styles.configPath}>
        <span>%APPDATA%\nightcap\config.json</span>
      </div>
    </div>
  )
}
