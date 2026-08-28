import { Badge } from "@/design/components/core/Badge"
import { Button } from "@/design/components/core/Button"
import { EmptyState } from "@/design/components/core/EmptyState"
import { Panel } from "@/design/components/core/Panel"
import { SectionHeader } from "@/design/components/core/SectionHeader"
import { ListRow } from "@/design/components/data/ListRow"
import { ProcessName } from "@/design/components/data/ProcessName"
import { mmss, whenKilled } from "@/format"
import type { KillRecord } from "@/types"
import styles from "./HistoryView.module.scss"

interface HistoryViewProps {
  history: KillRecord[]
  onClear: () => void
}

export function HistoryView({ history, onClear }: HistoryViewProps) {
  return (
    <div className="fade-in">
      <Panel pad={false}>
        <SectionHeader
          title="Closed by nightcap"
          count={history.length}
          hint="Last 200 kills"
          actions={
            <Button size="sm" variant="ghost" icon="eraser" onClick={onClear}>
              Clear
            </Button>
          }
        />
        {history.length === 0 && (
          <EmptyState icon="moon" title="nightcap hasn’t closed anything.">
            Everything on the watchlist has let go on its own.
          </EmptyState>
        )}
        {history.map((h, i) => (
          <ListRow
            key={i}
            leading={
              <Badge tone="closed" icon="power">
                closed
              </Badge>
            }
            meta={<span className={styles.idle}>after {mmss(h.idleSecs)} idle</span>}
            actions={<span className={styles.when}>{whenKilled(h.at)}</span>}
          >
            <ProcessName exe={h.exe} />
            <div className={styles.reason}>{h.reason}</div>
          </ListRow>
        ))}
      </Panel>
    </div>
  )
}
