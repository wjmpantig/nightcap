import { mmss, whenKilled } from "../../format"
import type { KillRecord } from "../../types"
import { Badge } from "../components/core/Badge"
import { Button } from "../components/core/Button"
import { EmptyState } from "../components/core/EmptyState"
import { Panel } from "../components/core/Panel"
import { SectionHeader } from "../components/core/SectionHeader"
import { ListRow } from "../components/data/ListRow"
import { ProcessName } from "../components/data/ProcessName"

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
            meta={
              <span style={{ fontFamily: "var(--font-mono)" }}>after {mmss(h.idleSecs)} idle</span>
            }
            actions={
              <span
                style={{
                  font: "var(--type-mono-sm)",
                  color: "var(--text-muted)",
                  minWidth: 96,
                  textAlign: "right",
                }}
              >
                {whenKilled(h.at)}
              </span>
            }
          >
            <ProcessName exe={h.exe} />
            <div style={{ font: "var(--type-small)", color: "var(--text-muted)", marginTop: 2 }}>
              {h.reason}
            </div>
          </ListRow>
        ))}
      </Panel>
    </div>
  )
}
