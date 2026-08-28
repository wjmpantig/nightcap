import { Panel } from '../components/core/Panel'
import { SectionHeader } from '../components/core/SectionHeader'
import { Button } from '../components/core/Button'
import { Badge } from '../components/core/Badge'
import { EmptyState } from '../components/core/EmptyState'
import { ListRow } from '../components/data/ListRow'
import { ProcessName } from '../components/data/ProcessName'

import type { Request } from './mock'

interface AwakeViewProps {
  requests: Request[]
  watched: Set<string>
  onWatch: (exe: string) => void
}

export function AwakeView({ requests, watched, onWatch }: AwakeViewProps) {
  const killable = requests.filter(r => r.exe !== '')
  const drivers = requests.filter(r => r.exe === '')
  return (
    <div className="fade-in" style={{display:'flex',flexDirection:'column',gap:'var(--gap-section)'}}>
      <Panel pad={false}>
        <SectionHeader title="Keeping this PC awake" count={killable.length}
          hint="powercfg polled 2s ago"
          actions={<Button size="sm" variant="ghost" icon="refresh-cw">Refresh</Button>} />
        {killable.length === 0 && (
          <EmptyState title="Nothing is holding a wake lock right now.">
            This PC will sleep on its own schedule.
          </EmptyState>
        )}
        {killable.map(r => {
          const targets = r.hosts.length ? r.hosts : [r.exe]
          const allWatched = targets.every(t => watched.has(t))
          return (
            <ListRow key={r.exe + r.category}
              leading={<Badge tone="awake" dot>{r.category.toLowerCase()}</Badge>}
              meta={r.reason}
              actions={allWatched
                ? <Badge tone="watched" icon="eye">watching {targets.join(', ')}</Badge>
                : targets.filter(t => !watched.has(t)).map(t => (
                    <Button key={t} size="sm" icon="eye" onClick={() => onWatch(t)}>
                      Watch{targets.length > 1 || t !== r.exe ? ' ' + t : ''}
                    </Button>
                  ))}>
              <ProcessName exe={r.exe} hosts={r.hosts} path={r.path} />
            </ListRow>
          )
        })}
      </Panel>

      {drivers.length > 0 && (
        <Panel pad={false} tone="quiet">
          <SectionHeader title="Held by drivers and services" count={drivers.length}
            hint="No process to close — shown for the record" />
          {drivers.map((r, i) => (
            <ListRow key={i} interactive={false} leading={<Badge tone="locked" icon="lock">{r.category.toLowerCase()}</Badge>}>
              <div style={{font:'var(--type-body)',color:'var(--text-secondary)'}}>{r.reason}</div>
            </ListRow>
          ))}
        </Panel>
      )}
    </div>
  )
}
