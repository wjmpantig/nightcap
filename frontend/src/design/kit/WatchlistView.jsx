import { useState } from 'react'
import { Panel } from '../components/core/Panel.jsx'
import { SectionHeader } from '../components/core/SectionHeader.jsx'
import { Button } from '../components/core/Button.jsx'
import { Badge } from '../components/core/Badge.jsx'
import { EmptyState } from '../components/core/EmptyState.jsx'
import { NumberField } from '../components/forms/NumberField.jsx'
import { Select } from '../components/forms/Select.jsx'
import { TextInput } from '../components/forms/TextInput.jsx'
import { ListRow } from '../components/data/ListRow.jsx'
import { ProcessName } from '../components/data/ProcessName.jsx'
import { SNOOZE_OPTIONS, humanRemaining } from './mock.js'

export function WatchlistView({ entries, defaultTimeout, onSetTimeout, onSnooze, onRemove, onAdd }) {
  const [draft, setDraft] = useState('')
  const now = Date.now()
  return (
    <div className="fade-in" style={{display:'flex',flexDirection:'column',gap:'var(--gap-section)'}}>
      <Panel pad={false}>
        <SectionHeader title="Watchlist" count={entries.length}
          hint="No exceptions — a watched app is closed even fullscreen" />
        {entries.length === 0 && (
          <EmptyState icon="eye-off" title="Nothing watched yet.">
            Add an app from “Keeping this PC awake”, or type its executable name below.
          </EmptyState>
        )}
        {entries.map(e => {
          const left = e.snoozedUntil ? Math.max(0, new Date(e.snoozedUntil).getTime() - now) : 0
          return (
            <ListRow key={e.exe} muted={left > 0}
              leading={left > 0
                ? <Badge tone="snoozed" icon="alarm-clock">snoozed {humanRemaining(left)}</Badge>
                : <Badge tone="watched" icon="eye">armed</Badge>}
              actions={<>
                <NumberField value={e.timeoutMinutes || ''} placeholder={String(defaultTimeout)} unit="min"
                  width={88} onChange={ev => onSetTimeout(e.exe, Number(ev.target.value) || 0)} />
                {left > 0
                  ? <Button size="sm" variant="ghost" onClick={() => onSnooze(e.exe, 0)}>Un-snooze</Button>
                  : <Select placeholder="Snooze…" value="" options={SNOOZE_OPTIONS}
                      onChange={ev => ev.target.value && onSnooze(e.exe, Number(ev.target.value))} />}
                <Button size="sm" variant="danger" icon="trash-2" onClick={() => onRemove(e.exe)}>Remove</Button>
              </>}>
              <ProcessName exe={e.exe} />
            </ListRow>
          )
        })}
      </Panel>

      <Panel>
        <div style={{display:'flex',alignItems:'center',gap:'var(--space-5)'}}>
          <TextInput icon="plus" placeholder="Add an executable, e.g. spotify.exe" width={320}
            value={draft} onChange={e => setDraft(e.target.value)} />
          <Button variant="secondary" disabled={!draft.trim()}
            onClick={() => { onAdd(draft.trim()); setDraft('') }}>Add to watchlist</Button>
          <span style={{font:'var(--type-small)',color:'var(--text-muted)',maxWidth:280}}>
            Shared runtimes like msedgewebview2.exe are refused — watch the owning app instead.
          </span>
        </div>
      </Panel>
    </div>
  )
}
