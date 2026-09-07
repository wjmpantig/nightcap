import { useCallback, useEffect, useState } from "react"
import {
  AddToWatchlist,
  ClearHistory,
  GetConfig,
  GetConfigPath,
  GetStatus,
  GetVersion,
  KillNow,
  RemoveFromWatchlist,
  SaveSettings,
  SetAutostart,
  SetPaused,
  SetTimeout,
  Snooze,
} from "../wailsjs/go/main/App"
import { EventsOn } from "../wailsjs/runtime/runtime"
import styles from "./App.module.scss"
import { call, whenReady } from "./bridge"
import { Lockup } from "./design/components/brand/Lockup"
import { Mark } from "./design/components/brand/Mark"
import { Badge } from "./design/components/core/Badge"
import { Banner } from "./design/components/core/Banner"
import { Icon } from "./design/components/core/Icon"
import { Panel } from "./design/components/core/Panel"
import { IdleMeter } from "./design/components/data/IdleMeter"
import { Switch } from "./design/components/forms/Switch"
import { AboutView } from "./design/kit/AboutView"
import { AwakeView } from "./design/kit/AwakeView"
import { HistoryView } from "./design/kit/HistoryView"
import { SettingsView } from "./design/kit/SettingsView"
import { WarningOverlay } from "./design/kit/WarningOverlay"
import { WatchlistView } from "./design/kit/WatchlistView"
import { snoozeRemaining } from "./format"
import type { Config, Settings, Status } from "./types"

const EMPTY: Status = {
  requests: [],
  idleSecs: 0,
  fullscreen: false,
  pending: [],
  error: "",
  warning: "",
}

const NAV = [
  { id: "awake", label: "Keeping awake", icon: "zap" },
  { id: "watchlist", label: "Watchlist", icon: "eye" },
  { id: "history", label: "Closed", icon: "power" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "about", label: "About", icon: "info" },
] as const

type ViewId = (typeof NAV)[number]["id"]

export default function App() {
  const [status, setStatus] = useState<Status>(EMPTY)
  const [cfg, setCfg] = useState<Config | null>(null)
  const [view, setView] = useState<ViewId>("awake")
  // Stamped in at build time, so it never changes while the app is running.
  const [version, setVersion] = useState("")
  const [configPath, setConfigPath] = useState("")
  // Local clock so the kill countdown ticks smoothly between the backend's 5s polls.
  const [now, setNow] = useState(Date.now())

  const [ready, setReady] = useState(false)
  const [readyFailed, setReadyFailed] = useState(false)

  // Stable identities: the startup effect must run exactly once, or every render
  // would subscribe another EventsOn("status") listener.
  const refresh = useCallback(
    () =>
      call(() => GetConfig())
        .then((c) => setCfg(c as unknown as Config))
        .catch((e) => console.error("GetConfig failed", e)),
    [],
  )

  const poll = useCallback(
    () =>
      call(() => GetStatus())
        .then((s) => setStatus(s as unknown as Status))
        .catch((e) => console.error("GetStatus failed", e)),
    [],
  )

  useEffect(() => {
    let live = true
    // Bindings are injected after this module runs, so wait for them rather
    // than letting a missing window.go throw and blank the window.
    whenReady().then((ok) => {
      if (!live) return
      setReady(ok)
      if (!ok) {
        setReadyFailed(true)
        return
      }
      poll()
      refresh()
      call(() => GetVersion())
        .then((v) => setVersion(v as string))
        .catch((e) => console.error("GetVersion failed", e))
      call(() => GetConfigPath())
        .then((p) => setConfigPath(p as string))
        .catch((e) => console.error("GetConfigPath failed", e))
      EventsOn("status", (s: Status) => {
        setStatus(s)
        refresh() // a kill or an expired snooze can change the watchlist view
      })
    })
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [poll, refresh])

  const act = (p: () => Promise<unknown>) =>
    call(p)
      .then(refresh)
      .catch((e) => console.error(e))

  if (!ready) {
    return (
      <div className={styles.win}>
        <main className={styles.scroll}>
          <Panel>
            {readyFailed ? (
              <Banner tone="error" title="Could not reach the nightcap backend">
                window.go was never injected. Open devtools (right-click &gt; Inspect) and check the
                console.
              </Banner>
            ) : (
              <div className={styles.starting}>Starting nightcap…</div>
            )}
          </Panel>
        </main>
      </div>
    )
  }

  const watchlist = cfg?.watchlist ?? []
  const watched = new Set(watchlist.map((e) => e.exe))
  const killable = status.requests.filter((r) => r.exe !== "")
  const pending = status.pending
  const armed = watchlist.filter((e) => snoozeRemaining(e, now) === 0).length
  const timeout = cfg?.defaultTimeoutMinutes ?? 0

  const counts: Record<ViewId, number> = {
    awake: killable.length,
    watchlist: watchlist.length,
    history: cfg?.history.length ?? 0,
    settings: 0,
    about: 0,
  }

  // SaveSettings takes both numbers at once; autostart and paused have their own
  // bindings. The view speaks in patches, so fan them back out here.
  const applySettings = (patch: Partial<Settings>) => {
    if (!cfg) return
    const { autostart, paused, defaultTimeoutMinutes, warningSeconds } = patch
    if (autostart !== undefined) act(() => SetAutostart(autostart))
    else if (paused !== undefined) act(() => SetPaused(paused))
    else
      act(() =>
        SaveSettings(
          defaultTimeoutMinutes ?? cfg.defaultTimeoutMinutes,
          warningSeconds ?? cfg.warningSeconds,
        ),
      )
  }

  return (
    <div className={styles.win}>
      <header className={styles.titlebar}>
        <Lockup size={15} />
        {status.fullscreen && (
          <Badge tone="snoozed" icon="maximize" className={styles.fullscreenFlag}>
            fullscreen
          </Badge>
        )}
      </header>

      <div className={styles.split}>
        <nav className={styles.sidebar}>
          {NAV.map((n) => (
            <button
              type="button"
              key={n.id}
              className={styles.navItem}
              aria-current={view === n.id ? "page" : undefined}
              onClick={() => setView(n.id)}
            >
              <Icon name={n.icon} size={14} />
              {n.label}
              {counts[n.id] > 0 && <span className={styles.navCount}>{counts[n.id]}</span>}
            </button>
          ))}

          <div className={styles.status}>
            <div className={styles.statusHead}>
              <Mark
                size={20}
                state={cfg?.paused ? "inactive" : "active"}
                className={cfg?.paused ? styles.markPaused : styles.mark}
              />
              {cfg?.paused ? (
                <Badge tone="snoozed">paused</Badge>
              ) : (
                <Badge tone="watched" dot>
                  {armed} armed
                </Badge>
              )}
            </div>
            <IdleMeter idleSecs={status.idleSecs} timeoutMinutes={timeout} />
            <Switch
              checked={cfg?.paused ?? false}
              tone="amber"
              label="Pause"
              onChange={(e) => act(() => SetPaused(e.target.checked))}
            />
          </div>
        </nav>

        <main className={styles.scroll}>
          {status.warning && (
            <Banner tone="warning" className={styles.warning}>
              {status.warning}
            </Banner>
          )}

          {view === "awake" && (
            <AwakeView
              requests={status.requests}
              watched={watched}
              error={status.error}
              onWatch={(exe) => act(() => AddToWatchlist(exe))}
              onKill={(exe) => act(() => KillNow(exe))}
              onRefresh={poll}
            />
          )}
          {view === "watchlist" && (
            <WatchlistView
              entries={watchlist}
              defaultTimeout={timeout}
              onSetTimeout={(exe, m) => act(() => SetTimeout(exe, m))}
              onSnooze={(exe, mins) => act(() => Snooze(exe, mins))}
              onRemove={(exe) => act(() => RemoveFromWatchlist(exe))}
              onAdd={(exe) => act(() => AddToWatchlist(exe))}
            />
          )}
          {view === "history" && (
            <HistoryView history={cfg?.history ?? []} onClear={() => act(() => ClearHistory())} />
          )}
          {view === "settings" && cfg && (
            <SettingsView cfg={cfg} onChange={applySettings} configPath={configPath} />
          )}
          {view === "about" && <AboutView version={version} />}
        </main>
      </div>

      {pending.length > 0 && (
        <WarningOverlay
          pending={pending.map((p) => p.exe)}
          remaining={(new Date(pending[0].deadline).getTime() - now) / 1000}
          total={cfg?.warningSeconds ?? 0}
          idleSecs={status.idleSecs}
          onSnooze={(mins) => act(() => Promise.all(pending.map((p) => Snooze(p.exe, mins))))}
        />
      )}
    </div>
  )
}
