import { Badge } from "@/design/components/core/Badge"
import { Banner } from "@/design/components/core/Banner"
import { Button } from "@/design/components/core/Button"
import { EmptyState } from "@/design/components/core/EmptyState"
import { Panel } from "@/design/components/core/Panel"
import { SectionHeader } from "@/design/components/core/SectionHeader"
import { ListRow } from "@/design/components/data/ListRow"
import { ProcessName } from "@/design/components/data/ProcessName"
import { targetsOf } from "@/format"
import type { Request } from "@/types"
import { cx } from "@/utils/cx"
import styles from "./AwakeView.module.scss"

interface AwakeViewProps {
  requests: Request[]
  watched: Set<string>
  onWatch: (exe: string) => void
  onRefresh: () => void
  /**
   * Status.error — the power request query could not be read at all. "I
   * couldn't check" and "nothing is keeping you awake" are different states,
   * so this replaces the empty state rather than sitting above it.
   */
  error?: string
}

export function AwakeView({ requests, watched, onWatch, onRefresh, error }: AwakeViewProps) {
  const killable = requests.filter((r) => r.exe !== "")
  const drivers = requests.filter((r) => r.exe === "")
  return (
    <div className={cx("fade-in", styles.view)}>
      <Panel pad={false}>
        <SectionHeader
          title="Keeping this machine awake"
          count={killable.length}
          hint="Re-polled every 5s"
          actions={
            <Button size="sm" variant="ghost" icon="refresh-cw" onClick={onRefresh}>
              Refresh
            </Button>
          }
        />
        {error ? (
          <div className={styles.errorSlot}>
            <Banner
              tone="error"
              title="nightcap could not check what is keeping this machine awake"
            >
              {error}
            </Banner>
          </div>
        ) : (
          killable.length === 0 && (
            // killable excludes driver and service requests, which have no
            // process to close. Without this split the view claimed nothing
            // was holding a wake lock while listing several below.
            <EmptyState
              title={
                drivers.length > 0
                  ? "Nothing here can be closed."
                  : "Nothing is holding a wake lock right now."
              }
            >
              {drivers.length > 0
                ? "The wake locks below are held by drivers and services."
                : "This machine will sleep on its own schedule."}
            </EmptyState>
          )
        )}
        {killable.map((r) => {
          const targets = targetsOf(r)
          const allWatched = targets.every((t) => watched.has(t))
          return (
            <ListRow
              key={r.exe + r.category}
              leading={
                <Badge tone="awake" dot>
                  {r.category.toLowerCase()}
                </Badge>
              }
              meta={r.reason}
              actions={
                allWatched ? (
                  <Badge tone="watched" icon="eye">
                    watching {targets.join(", ")}
                  </Badge>
                ) : (
                  targets
                    .filter((t) => !watched.has(t))
                    .map((t) => (
                      <Button key={t} size="sm" icon="eye" onClick={() => onWatch(t)}>
                        Watch{targets.length > 1 || t !== r.exe ? ` ${t}` : ""}
                      </Button>
                    ))
                )
              }
            >
              <ProcessName exe={r.exe} hosts={r.hosts} path={r.path} />
            </ListRow>
          )
        })}
      </Panel>

      {drivers.length > 0 && (
        <Panel pad={false} tone="quiet">
          <SectionHeader
            title="Held by drivers and services"
            count={drivers.length}
            hint="No process to close — shown for the record"
          />
          {drivers.map((r, i) => (
            <ListRow
              key={i}
              interactive={false}
              leading={
                <Badge tone="locked" icon="lock">
                  {r.category.toLowerCase()}
                </Badge>
              }
            >
              <div className={styles.driverReason}>{r.reason}</div>
            </ListRow>
          ))}
        </Panel>
      )}
    </div>
  )
}
