import { Badge } from "@/design/components/core/Badge"
import { ListRow } from "@/design/components/data/ListRow"
import { ProcessName } from "@/design/components/data/ProcessName"
import styles from "./Mock.module.scss"

// Not a screenshot: the rows below are the app's own ListRow, Badge and
// ProcessName, so this window cannot drift away from what nightcap renders.
const ROWS = [
  {
    exe: "msedgewebview2.exe",
    hosts: ["Widgets.exe", "GoogleDriveFS.exe"],
    meta: "Video playback · 41m",
    badge: { tone: "awake", label: "keeping awake" },
  },
  {
    exe: "vlc.exe",
    meta: "closes after 15m idle",
    badge: { tone: "watched", label: "watched" },
  },
  {
    exe: "Docker Desktop.exe",
    meta: "closed at 02:14, after 22m 04s idle",
    badge: { tone: "closed", label: "closed" },
  },
  {
    exe: "spotify.exe",
    meta: "snoozed 3h 40m",
    badge: { tone: "snoozed", label: "snoozed" },
    muted: true,
  },
  {
    exe: "Realtek Audio Service",
    meta: "driver — nightcap cannot close this",
    badge: { tone: "locked", label: "system" },
    muted: true,
  },
] as const

export function Mock() {
  return (
    <div className={styles.frame}>
      <div className={styles.titlebar}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.title}>nightcap — 1 keeping this machine awake</span>
      </div>
      <div className={styles.rows}>
        {ROWS.map((row) => (
          <ListRow
            key={row.exe}
            interactive={false}
            muted={"muted" in row ? row.muted : false}
            leading={
              <span className={styles.state}>
                <Badge tone={row.badge.tone} dot shape="pill">
                  {row.badge.label}
                </Badge>
              </span>
            }
            meta={row.meta}
          >
            <ProcessName exe={row.exe} hosts={"hosts" in row ? [...row.hosts] : undefined} />
          </ListRow>
        ))}
      </div>
    </div>
  )
}
