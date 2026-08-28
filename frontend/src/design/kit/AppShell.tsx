import { useEffect, useState } from 'react'
import { Lockup } from '../components/brand/Lockup'
import { Mark } from '../components/brand/Mark'
import { Icon } from '../components/core/Icon'
import { IconButton } from '../components/core/IconButton'
import { Badge } from '../components/core/Badge'
import { Button } from '../components/core/Button'
import { Switch } from '../components/forms/Switch'
import { IdleMeter } from '../components/data/IdleMeter'
import { AwakeView } from './AwakeView'
import { WatchlistView } from './WatchlistView'
import { HistoryView } from './HistoryView'
import { SettingsView } from './SettingsView'
import { WarningOverlay } from './WarningOverlay'
import { TrayMenu } from './TrayMenu'
import type { KitConfig } from './mock'
import { REQUESTS, WATCHLIST, HISTORY } from './mock'
import './kit.css'

type ViewId = 'awake' | 'watchlist' | 'history' | 'settings'

interface Pending {
  apps: string[]
  remaining: number
  total: number
}

const NAV: { id: ViewId; label: string; icon: string }[] = [
  {id:'awake', label:'Keeping awake', icon:'zap'},
  {id:'watchlist', label:'Watchlist', icon:'eye'},
  {id:'history', label:'Closed', icon:'power'},
  {id:'settings', label:'Settings', icon:'settings'},
]

export function AppShell() {
  const [view, setView] = useState<ViewId>('awake')
  const [requests] = useState(REQUESTS)
  const [entries, setEntries] = useState(WATCHLIST)
  const [history, setHistory] = useState(HISTORY)
  const [cfg, setCfg] = useState<KitConfig>({defaultTimeoutMinutes:15, warningSeconds:30, autostart:true, paused:false})
  const [idleSecs, setIdle] = useState(1324)
  const [tray, setTray] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)

  useEffect(() => {
    const t = setInterval(() => setIdle(s => (cfg.paused ? s : s + 1)), 1000)
    return () => clearInterval(t)
  }, [cfg.paused])

  useEffect(() => {
    if (!pending) return
    const t = setInterval(() => setPending(p => (p && p.remaining > 0 ? {...p, remaining: p.remaining - 1} : p)), 1000)
    return () => clearInterval(t)
  }, [pending])

  const watched = new Set(entries.map(e => e.exe))
  const armed = entries.filter(e => !e.snoozedUntil || new Date(e.snoozedUntil) < new Date()).length

  const watch = (exe: string) => setEntries(es => es.some(e => e.exe === exe) ? es : [...es, {exe, timeoutMinutes:0, snoozedUntil:''}])
  const setTimeoutFor = (exe: string, m: number) => setEntries(es => es.map(e => e.exe === exe ? {...e, timeoutMinutes:m} : e))
  const snooze = (exe: string, mins: number) => setEntries(es => es.map(e => e.exe === exe
    ? {...e, snoozedUntil: mins === 0 ? '' : new Date(Date.now() + (mins < 0 ? 3.15e10 : mins*60e3)).toISOString()} : e))
  const remove = (exe: string) => setEntries(es => es.filter(e => e.exe !== exe))

  const fire = () => setPending({apps:['vlc.exe'], remaining: cfg.warningSeconds, total: cfg.warningSeconds})
  const counts: Partial<Record<ViewId, number>> = {awake: requests.filter(r => r.exe !== '').length, watchlist: entries.length, history: history.length}

  return (
    <div className="win">
      <header style={{display:'flex',alignItems:'center',gap:'var(--space-5)',height:'var(--titlebar-height)',
        padding:'0 var(--space-3) 0 var(--space-6)',background:'var(--surface-tile)',
        borderBottom:'1px solid var(--line)',flex:'0 0 auto'}}>
        <Lockup size={15} />
        <span style={{font:'var(--type-mono-sm)',color:'var(--text-muted)'}}>v1.0.0 · elevated</span>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'var(--space-2)'}}>
          <Button size="sm" variant="ghost" icon="triangle-alert" onClick={fire}>Simulate kill</Button>
          <IconButton icon="bell" label="Tray menu" size={26} onClick={() => setTray(t => !t)} />
          <IconButton icon="minus" label="Minimise" size={26} />
          <IconButton icon="x" label="Close" size={26} variant="close" />
        </div>
      </header>

      <div style={{flex:1,display:'flex',minHeight:0}}>
        <nav style={{width:'var(--sidebar-width)',flex:'0 0 auto',padding:'var(--space-6) var(--space-5)',
          background:'var(--surface-sunken)',borderRight:'1px solid var(--line)',
          display:'flex',flexDirection:'column',gap:'var(--space-2)'}}>
          {NAV.map(n => (
            <button key={n.id} className="nav" aria-current={view === n.id ? 'page' : undefined}
              onClick={() => setView(n.id)}>
              <Icon name={n.icon} size={14} />
              {n.label}
              {counts[n.id] != null && <span className="nav__count">{counts[n.id]}</span>}
            </button>
          ))}

          <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:'var(--space-5)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'var(--space-4)'}}>
              <Mark size={20} state={cfg.paused ? 'inactive' : 'active'}
                style={{color: cfg.paused ? 'var(--state-snoozed)' : 'var(--moonlight)'}} />
              {cfg.paused
                ? <Badge tone="snoozed">paused</Badge>
                : <Badge tone="watched" dot>{armed} armed</Badge>}
            </div>
            <IdleMeter idleSecs={idleSecs} timeoutMinutes={cfg.defaultTimeoutMinutes} />
            <Switch checked={cfg.paused} tone="amber" label="Pause"
              onChange={e => setCfg(c => ({...c, paused: e.target.checked}))} />
          </div>
        </nav>

        <main className="scroll">
          {view === 'awake' && <AwakeView requests={requests} watched={watched} onWatch={watch} />}
          {view === 'watchlist' && <WatchlistView entries={entries} defaultTimeout={cfg.defaultTimeoutMinutes}
            onSetTimeout={setTimeoutFor} onSnooze={snooze} onRemove={remove} onAdd={watch} />}
          {view === 'history' && <HistoryView history={history} onClear={() => setHistory([])} />}
          {view === 'settings' && <SettingsView cfg={cfg} onChange={patch => setCfg(c => ({...c, ...patch}))} />}
        </main>
      </div>

      {tray && <TrayMenu paused={cfg.paused} idleSecs={idleSecs} watching={armed}
        onTogglePause={() => setCfg(c => ({...c, paused: !c.paused}))}
        onOpen={() => setTray(false)} />}

      {pending && <WarningOverlay pending={pending.apps} remaining={pending.remaining} total={pending.total}
        idleSecs={idleSecs}
        onSnooze={mins => { pending.apps.forEach(a => snooze(a, mins)); setPending(null) }}
        onCancel={() => setPending(null)} />}
    </div>
  )
}
