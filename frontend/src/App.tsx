import {useEffect, useState} from 'react'
import './App.css'
import {
    AddToWatchlist, ClearHistory, GetConfig, GetStatus, RemoveFromWatchlist,
    SaveSettings, SetAutostart, SetPaused, SetTimeout, Snooze,
} from '../wailsjs/go/main/App'
import {EventsOn} from '../wailsjs/runtime/runtime'
import {call, whenReady} from './bridge'

type Request = { category: string; kind: string; exe: string; path: string; reason: string; hosts: string[] }
type WatchEntry = { exe: string; timeoutMinutes: number; snoozedUntil: string }
type KillRecord = { exe: string; at: string; idleSecs: number; category: string; reason: string }
type Config = {
    defaultTimeoutMinutes: number; warningSeconds: number
    watchlist: WatchEntry[]; autostart: boolean; paused: boolean
    history: KillRecord[]
}
type Pending = { exe: string; deadline: string }
type Status = {
    requests: Request[]; idleSecs: number; fullscreen: boolean
    pending: Pending[]; error: string; warning: string
}

const SNOOZE_OPTIONS = [
    {label: '15 minutes', minutes: 15},
    {label: '1 hour', minutes: 60},
    {label: '4 hours', minutes: 240},
    {label: '8 hours', minutes: 480},
    {label: 'Until I un-snooze', minutes: -1},
]

// A shared runtime (msedgewebview2.exe and friends) is never watchable itself:
// its name is shared by unrelated apps. The owning apps are the real targets.
function targetsOf(r: Request): string[] {
    return (r.hosts?.length ?? 0) > 0 ? r.hosts : [r.exe]
}

const EMPTY: Status = {requests: [], idleSecs: 0, fullscreen: false, pending: [], error: '', warning: ''}

function mmss(secs: number) {
    const s = Math.max(0, Math.round(secs))
    return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

function whenKilled(iso: string) {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const sameDay = d.toDateString() === new Date().toDateString()
    const time = d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    return sameDay ? time : `${d.toLocaleDateString([], {month: 'short', day: 'numeric'})} ${time}`
}

function snoozeRemaining(entry: WatchEntry, nowMs: number): number {
    const until = new Date(entry.snoozedUntil).getTime()
    if (!until || isNaN(until)) return 0
    return Math.max(0, until - nowMs)
}

function humanRemaining(ms: number) {
    const mins = Math.round(ms / 60000)
    if (mins > 60 * 24 * 365) return 'indefinitely'
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`
    return `${Math.max(1, mins)}m`
}

export default function App() {
    const [status, setStatus] = useState<Status>(EMPTY)
    const [cfg, setCfg] = useState<Config | null>(null)
    // Local clock so countdowns tick smoothly between the backend's 5s polls.
    const [now, setNow] = useState(Date.now())

    const [ready, setReady] = useState(false)
    const [readyFailed, setReadyFailed] = useState(false)

    const refresh = () =>
        call(() => GetConfig())
            .then(c => setCfg(c as unknown as Config))
            .catch(e => console.error('GetConfig failed', e))

    useEffect(() => {
        let live = true
        // Bindings are injected after this module runs, so wait for them rather
        // than letting a missing window.go throw and blank the window.
        whenReady().then(ok => {
            if (!live) return
            setReady(ok)
            if (!ok) {
                setReadyFailed(true)
                return
            }
            call(() => GetStatus())
                .then(s => setStatus(s as unknown as Status))
                .catch(e => console.error('GetStatus failed', e))
            refresh()
            EventsOn('status', (s: Status) => {
                setStatus(s)
                refresh() // a kill or an expired snooze can change the watchlist view
            })
        })
        const t = setInterval(() => setNow(Date.now()), 1000)
        return () => {
            live = false
            clearInterval(t)
        }
    }, [])

    const act = (p: () => Promise<any>) =>
        call(p).then(refresh).catch(e => console.error(e))

    if (!ready) {
        return (
            <div className="app">
                <p className="empty">
                    {readyFailed
                        ? 'Could not reach the nightcap backend: window.go was never injected. ' +
                          'Open devtools (right-click > Inspect) and check the console.'
                        : 'Starting nightcap...'}
                </p>
            </div>
        )
    }

    const watched = new Set((cfg?.watchlist ?? []).map(e => e.exe))
    const killable = (status.requests ?? []).filter(r => r.exe !== '')
    const pending = status.pending ?? []

    return (
        <div className="app">
            {pending.length > 0 && (
                <div className="overlay">
                    <div className="card">
                        <h2>Closing in {mmss((new Date(pending[0].deadline).getTime() - now) / 1000)}</h2>
                        <p>
                            <b>{pending.map(p => p.exe).join(', ')}</b> {pending.length > 1 ? 'are' : 'is'} keeping
                            this PC awake, and there has been no input for {mmss(status.idleSecs)}.
                        </p>
                        <div className="snooze-row">
                            <span>Snooze instead:</span>
                            {SNOOZE_OPTIONS.map(o => (
                                <button key={o.minutes}
                                        onClick={() => act(() => Promise.all(pending.map(p => Snooze(p.exe, o.minutes))))}>
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <header>
                <h1>nightcap</h1>
                <div className="state">
                    {cfg?.paused
                        ? <span className="pill warn">paused</span>
                        : <span className="pill">idle {mmss(status.idleSecs)}</span>}
                    {status.fullscreen && <span className="pill">fullscreen</span>}
                </div>
            </header>

            {status.error && <div className="banner error">{status.error}</div>}
            {status.warning && <div className="banner">{status.warning}</div>}

            <section>
                <h2>Keeping this PC awake</h2>
                {killable.length === 0 && !status.error && (
                    <p className="empty">Nothing is holding a wake lock right now.</p>
                )}
                <table>
                    <tbody>
                    {killable.map((r, i) => {
                        const targets = targetsOf(r)
                        return (
                            <tr key={`${r.exe}-${r.category}-${i}`}>
                                <td className="exe">
                                    {r.exe}
                                    {r.hosts?.length > 0 && (
                                        <div className="host">
                                            {r.hosts.length > 1 ? 'shared runtime, owned by' : 'owned by'}{' '}
                                            {r.hosts.join(', ')}
                                        </div>
                                    )}
                                </td>
                                <td className="cat">{r.category}</td>
                                <td className="reason">{r.reason}</td>
                                <td className="right">
                                    {targets.length === 0
                                        ? <span className="cat">owner unknown</span>
                                        : targets.map(t => watched.has(t)
                                            ? <span key={t} className="pill">watching {t}</span>
                                            : <button key={t} onClick={() => act(() => AddToWatchlist(t))}>
                                                Watch {targets.length > 1 || t !== r.exe ? t : ''}
                                            </button>)}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
                {status.requests.some(r => r.exe === '') && (
                    <p className="note">
                        Some wake locks are held by drivers or services. nightcap cannot close those.
                    </p>
                )}
            </section>

            <section>
                <h2>Watchlist</h2>
                {cfg?.watchlist.length === 0 && (
                    <p className="empty">Nothing watched yet. Add an app from the list above.</p>
                )}
                <table>
                    <tbody>
                    {cfg?.watchlist.map(e => {
                        const left = snoozeRemaining(e, now)
                        return (
                            <tr key={e.exe} className={left > 0 ? 'snoozed' : ''}>
                                <td className="exe">{e.exe}</td>
                                <td>
                                    <input type="number" min={1} placeholder={String(cfg.defaultTimeoutMinutes)}
                                           value={e.timeoutMinutes || ''}
                                           onChange={ev => act(() => SetTimeout(e.exe, Number(ev.target.value) || 0))}/>
                                    <span className="unit">min</span>
                                </td>
                                <td className="right">
                                    {left > 0 ? (
                                        <>
                                            <span className="pill">snoozed {humanRemaining(left)}</span>
                                            <button onClick={() => act(() => Snooze(e.exe, 0))}>Un-snooze</button>
                                        </>
                                    ) : (
                                        <select value="" onChange={ev => {
                                            if (ev.target.value !== '') act(() => Snooze(e.exe, Number(ev.target.value)))
                                        }}>
                                            <option value="">Snooze...</option>
                                            {SNOOZE_OPTIONS.map(o => (
                                                <option key={o.minutes} value={o.minutes}>{o.label}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button className="danger" onClick={() => act(() => RemoveFromWatchlist(e.exe))}>
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </section>

            {cfg && cfg.history.length > 0 && (
                <section>
                    <div className="section-head">
                        <h2>Closed by nightcap</h2>
                        <button onClick={() => act(() => ClearHistory())}>Clear</button>
                    </div>
                    <table>
                        <tbody>
                        {cfg.history.map((h, i) => (
                            <tr key={`${h.exe}-${h.at}-${i}`}>
                                <td className="exe">{h.exe}</td>
                                <td className="cat">{whenKilled(h.at)}</td>
                                <td className="reason">
                                    {h.reason || h.category}
                                </td>
                                <td className="right cat">after {mmss(h.idleSecs)} idle</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            )}

            {cfg && (
                <section className="settings">
                    <h2>Settings</h2>
                    <label>
                        Close watched apps after
                        <input type="number" min={1} value={cfg.defaultTimeoutMinutes}
                               onChange={e => act(() => SaveSettings(Number(e.target.value) || 1, cfg.warningSeconds))}/>
                        minutes idle
                    </label>
                    <label>
                        Warn for
                        <input type="number" min={0} value={cfg.warningSeconds}
                               onChange={e => act(() => SaveSettings(cfg.defaultTimeoutMinutes, Number(e.target.value) || 0))}/>
                        seconds first
                    </label>
                    <label className="check">
                        <input type="checkbox" checked={cfg.autostart}
                               onChange={e => act(() => SetAutostart(e.target.checked))}/>
                        Start nightcap at login
                    </label>
                    <label className="check">
                        <input type="checkbox" checked={cfg.paused}
                               onChange={e => act(() => SetPaused(e.target.checked))}/>
                        Pause watching
                    </label>
                </section>
            )}
        </div>
    )
}
