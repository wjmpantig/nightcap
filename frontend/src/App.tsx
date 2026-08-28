import { useCallback, useEffect, useState } from "react"
import {
  AddToWatchlist,
  ClearHistory,
  GetConfig,
  GetStatus,
  RemoveFromWatchlist,
  SaveSettings,
  SetAutostart,
  SetPaused,
  SetTimeout,
  Snooze,
} from "../wailsjs/go/main/App"
import { EventsOn } from "../wailsjs/runtime/runtime"
import { call, whenReady } from "./bridge"
import { Lockup } from "./design/components/brand/Lockup"
import { Mark } from "./design/components/brand/Mark"
import { Badge } from "./design/components/core/Badge"
import { Banner } from "./design/components/core/Banner"
import { Icon } from "./design/components/core/Icon"
import { Panel } from "./design/components/core/Panel"
import { IdleMeter } from "./design/components/data/IdleMeter"
import { Switch } from "./design/components/forms/Switch"
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
] as const

type ViewId = (typeof NAV)[number]["id"]

export default function App() {
  const [status, setStatus] = useState<Status>(EMPTY)
  const [cfg, setCfg] = useState<Config | null>(null)
  const [view, setView] = useState<ViewId>("awake")
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
      <div className="win">
        <main className="scroll">
          <Panel>
            {readyFailed ? (
              <Banner tone="error" title="Could not reach the nightcap backend">
                window.go was never injected. Open devtools (right-click &gt; Inspect) and check the
                console.
              </Banner>
            ) : (
              <div style={{ font: "var(--type-body)", color: "var(--text-secondary)" }}>
                Starting nightcap…
              </div>
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
    <div className="win">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-5)",
          height: "var(--titlebar-height)",
          padding: "0 var(--space-6)",
          background: "var(--surface-tile)",
          borderBottom: "1px solid var(--line)",
          flex: "0 0 auto",
        }}
      >
        <Lockup size={15} />
        {status.fullscreen && (
          <Badge tone="snoozed" icon="maximize" style={{ marginLeft: "auto" }}>
            fullscreen
          </Badge>
        )}
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <nav
          style={{
            width: "var(--sidebar-width)",
            flex: "0 0 auto",
            padding: "var(--space-6) var(--space-5)",
            background: "var(--surface-sunken)",
            borderRight: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          {NAV.map((n) => (
            <button
              type="button"
              key={n.id}
              className="nav"
              aria-current={view === n.id ? "page" : undefined}
              onClick={() => setView(n.id)}
            >
              <Icon name={n.icon} size={14} />
              {n.label}
              {counts[n.id] > 0 && <span className="nav__count">{counts[n.id]}</span>}
            </button>
          ))}

          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <Mark
                size={20}
                state={cfg?.paused ? "inactive" : "active"}
                style={{ color: cfg?.paused ? "var(--state-snoozed)" : "var(--moonlight)" }}
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

        <main className="scroll">
          {status.warning && (
            <Banner tone="warning" style={{ marginBottom: "var(--gap-section)" }}>
              {status.warning}
            </Banner>
          )}

          {view === "awake" && (
            <AwakeView
              requests={status.requests}
              watched={watched}
              error={status.error}
              onWatch={(exe) => act(() => AddToWatchlist(exe))}
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
          {view === "settings" && cfg && <SettingsView cfg={cfg} onChange={applySettings} />}
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
