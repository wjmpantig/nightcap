import { useState } from "react"
import { Badge } from "@/design/components/core/Badge"
import { Button } from "@/design/components/core/Button"
import { EmptyState } from "@/design/components/core/EmptyState"
import { Panel } from "@/design/components/core/Panel"
import { SectionHeader } from "@/design/components/core/SectionHeader"
import { ListRow } from "@/design/components/data/ListRow"
import { ProcessName } from "@/design/components/data/ProcessName"
import { NumberField } from "@/design/components/forms/NumberField"
import { Select } from "@/design/components/forms/Select"
import { TextInput } from "@/design/components/forms/TextInput"
import { humanRemaining, SNOOZE_OPTIONS } from "@/format"
import type { WatchEntry } from "@/types"
import { cx } from "@/utils/cx"
import styles from "./WatchlistView.module.scss"

interface WatchlistViewProps {
  entries: WatchEntry[]
  defaultTimeout: number
  onSetTimeout: (exe: string, minutes: number) => void
  onSnooze: (exe: string, minutes: number) => void
  onRemove: (exe: string) => void
  onAdd: (exe: string) => void
}

export function WatchlistView({
  entries,
  defaultTimeout,
  onSetTimeout,
  onSnooze,
  onRemove,
  onAdd,
}: WatchlistViewProps) {
  const [draft, setDraft] = useState("")
  const now = Date.now()
  return (
    <div className={cx("fade-in", styles.view)}>
      <Panel pad={false}>
        <SectionHeader
          title="Watchlist"
          count={entries.length}
          hint="No exceptions — a watched app is closed even fullscreen"
        />
        {entries.length === 0 && (
          <EmptyState icon="eye-off" title="Nothing watched yet.">
            Add an app from “Keeping this machine awake”, or type its executable name below.
          </EmptyState>
        )}
        {entries.map((e) => {
          const left = e.snoozedUntil ? Math.max(0, new Date(e.snoozedUntil).getTime() - now) : 0
          return (
            <ListRow
              key={e.exe}
              muted={left > 0}
              leading={
                left > 0 ? (
                  <Badge tone="snoozed" icon="alarm-clock">
                    snoozed {humanRemaining(left)}
                  </Badge>
                ) : (
                  <Badge tone="watched" icon="eye">
                    armed
                  </Badge>
                )
              }
              actions={
                <>
                  <NumberField
                    value={e.timeoutMinutes || ""}
                    placeholder={String(defaultTimeout)}
                    unit="min"
                    width={88}
                    onChange={(ev) => onSetTimeout(e.exe, Number(ev.target.value) || 0)}
                  />
                  {left > 0 ? (
                    <Button size="sm" variant="ghost" onClick={() => onSnooze(e.exe, 0)}>
                      Un-snooze
                    </Button>
                  ) : (
                    <Select
                      placeholder="Snooze…"
                      value=""
                      options={SNOOZE_OPTIONS}
                      onChange={(ev) => ev.target.value && onSnooze(e.exe, Number(ev.target.value))}
                    />
                  )}
                  <Button size="sm" variant="danger" icon="trash-2" onClick={() => onRemove(e.exe)}>
                    Remove
                  </Button>
                </>
              }
            >
              <ProcessName exe={e.exe} />
            </ListRow>
          )
        })}
      </Panel>

      <Panel>
        <div className={styles.addRow}>
          <TextInput
            icon="plus"
            placeholder="Add an executable, e.g. spotify.exe"
            width={320}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!draft.trim()}
            onClick={() => {
              onAdd(draft.trim())
              setDraft("")
            }}
          >
            Add to watchlist
          </Button>
          <span className={styles.addHint}>
            Shared runtimes like msedgewebview2.exe are refused — watch the owning app instead.
          </span>
        </div>
      </Panel>
    </div>
  )
}
