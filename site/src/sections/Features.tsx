import { Panel } from "@/design/components/core/Panel"
import styles from "./Features.module.scss"

const FEATURES = [
  {
    title: "It tells you when it is guessing",
    body: "powercfg names wake-lock holders by image path and never by PID. When several apps embed the same runtime, nightcap lists every candidate owner instead of picking one — and refuses to close a runtime by name.",
  },
  {
    title: "Almost nothing leaves the machine",
    body: "No account, no telemetry. Process names stay here. The only network call is a once-a-day check for a newer release, which nightcap tells you about and never installs by itself.",
  },
  {
    title: "Snooze instead of removing",
    body: "Rendering overnight? Snooze an app for 15 minutes, an hour, four, eight, or indefinitely. It stays on the watchlist and the snooze survives a restart.",
  },
  {
    title: "Find out what died overnight",
    body: "Closed by nightcap keeps the last 200 kills: what was closed, when, how long you had been idle, and the reason the app gave for holding the lock.",
  },
  {
    title: "Lives in the tray",
    body: "One glance: the mark is lit while something is holding a wake lock and dim when the machine is settled. Pause everything from the tray menu without losing the watchlist.",
  },
  {
    title: "Fullscreen is not a loophole",
    body: "A fullscreen app normally pauses the idle timer. A watchlisted one does not — otherwise a media player stuck on a paused video could never be caught, which is the reason this exists.",
  },
]

export function Features() {
  return (
    <div className={styles.grid}>
      {FEATURES.map((feature) => (
        <Panel key={feature.title} className={styles.card}>
          <h3 className={styles.title}>{feature.title}</h3>
          <p className={styles.body}>{feature.body}</p>
        </Panel>
      ))}
    </div>
  )
}
