import { Badge } from "@/design/components/core/Badge"
import { Button } from "@/design/components/core/Button"
import { Panel } from "@/design/components/core/Panel"
import { CountdownRing } from "@/design/components/data/CountdownRing"
import { mmss, SNOOZE_OPTIONS } from "@/format"
import styles from "./WarningOverlay.module.scss"

interface WarningOverlayProps {
  /** Executable names about to be closed. */
  pending: string[]
  remaining: number
  total: number
  idleSecs: number
  onSnooze: (minutes: number) => void
}

// There is no cancel. The backend arms the countdown and the only way out is to
// snooze — a "Cancel" that silently re-armed on the next tick would be a lie
// about a dialog that is thirty seconds from terminating your process.
export function WarningOverlay({
  pending,
  remaining,
  total,
  idleSecs,
  onSnooze,
}: WarningOverlayProps) {
  return (
    <div className={styles.scrim}>
      <Panel tone="accent" className={styles.dialog}>
        <div className={styles.top}>
          <CountdownRing remaining={remaining} total={total} size={92} />
          <div className={styles.copy}>
            <h2 className={styles.heading}>
              Closing {pending.length > 1 ? `${pending.length} apps` : pending[0]}
            </h2>
            <div className={styles.detail}>
              {pending.length > 1 ? "They are" : "It is"} holding a wake lock and there has been no
              input for <span className={styles.idle}>{mmss(idleSecs)}</span>. Unsaved work will be
              lost.
            </div>
            <div className={styles.targets}>
              {pending.map((p) => (
                <Badge key={p} tone="closed" shape="square">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.snooze}>
          <span className={styles.snoozeLabel}>Snooze instead</span>
          {SNOOZE_OPTIONS.map((o) => (
            <Button key={o.value} size="sm" onClick={() => onSnooze(o.value)}>
              {o.label}
            </Button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
