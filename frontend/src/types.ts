// The Go boundary types, hand-written.
//
// wailsjs/go/main/App.d.ts imports `main.Config` / `main.Status` from a
// wailsjs/models.ts that `wails build` has never generated here, so the
// generated signatures resolve to nothing useful and every call site has to
// cast. These declarations are that cast's target: keep them in step with
// Request/WatchEntry/KillRecord/Config in config.go and Status/pending in
// watcher.go.
//
// Every array below is guaranteed non-null on the wire: Status goes through
// normalize() in watcher.go and Config through sanitize() in config.go, because
// Go marshals a nil slice as JSON null and .filter()/.map() on null throws
// inside render and blanks the window.

export interface Request {
  /** DISPLAY | SYSTEM | AWAYMODE | EXECUTION | PERFBOOST | ACTIVELOCKSCREEN */
  category: string
  /** PROCESS | DRIVER | SERVICE */
  kind: string
  /** Lowercased basename. Empty for drivers and services — those are unkillable. */
  exe: string
  /** The raw requester string powercfg reported. */
  path: string
  reason: string
  /**
   * The app(s) owning `exe` when it is a shared runtime such as
   * msedgewebview2.exe. powercfg never reports a PID, so more than one entry
   * means the holder genuinely cannot be pinned down — show them all.
   */
  hosts: string[]
}

export interface WatchEntry {
  exe: string
  /** 0 means "use Config.defaultTimeoutMinutes". */
  timeoutMinutes: number
  /** RFC3339. Go's zero time arrives as "0001-01-01T00:00:00Z", not "". */
  snoozedUntil: string
}

export interface KillRecord {
  exe: string
  /** RFC3339. */
  at: string
  idleSecs: number
  category: string
  reason: string
}

export interface Config {
  defaultTimeoutMinutes: number
  warningSeconds: number
  watchlist: WatchEntry[]
  autostart: boolean
  paused: boolean
  /** Newest first, trimmed to historyLimit (200) by sanitize(). */
  history: KillRecord[]
}

/** The scalar half of Config — everything the settings view can edit. */
export type Settings = Pick<
  Config,
  "defaultTimeoutMinutes" | "warningSeconds" | "autostart" | "paused"
>

export interface Pending {
  exe: string
  /** RFC3339 — when the warning countdown runs out. */
  deadline: string
}

export interface Status {
  requests: Request[]
  idleSecs: number
  fullscreen: boolean
  pending: Pending[]
  /** Set when powercfg could not be read at all — "I couldn't check", not "nothing found". */
  error: string
  warning: string
}
