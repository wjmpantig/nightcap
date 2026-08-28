import { Panel } from '../components/core/Panel.jsx'
import { Button } from '../components/core/Button.jsx'
import { Badge } from '../components/core/Badge.jsx'
import { CountdownRing } from '../components/data/CountdownRing.jsx'
import { SNOOZE_OPTIONS, mmss } from './mock.js'

export function WarningOverlay({ pending, remaining, total, idleSecs, onSnooze, onCancel }) {
  return (
    <div style={{position:'absolute',inset:0,zIndex:20,display:'flex',alignItems:'center',
      justifyContent:'center',background:'var(--surface-overlay)',backdropFilter:'blur(6px)',
      animation:'fade var(--dur-base) var(--ease-out)'}}>
      <Panel tone="accent" style={{width:520,padding:'var(--space-8)'}}>
        <div style={{display:'flex',gap:'var(--space-8)',alignItems:'flex-start'}}>
          <CountdownRing remaining={remaining} total={total} size={92} />
          <div style={{flex:1,minWidth:0}}>
            <h2 style={{font:'var(--type-title)',marginBottom:'var(--space-4)'}}>
              Closing {pending.length > 1 ? pending.length + ' apps' : pending[0]}
            </h2>
            <div style={{font:'var(--type-body)',color:'var(--text-secondary)'}}>
              {pending.length > 1 ? 'They are' : 'It is'} holding a wake lock and there has been no input for{' '}
              <span style={{fontFamily:'var(--font-mono)',color:'var(--text-primary)'}}>{mmss(idleSecs)}</span>.
              Unsaved work will be lost.
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'var(--space-3)',marginTop:'var(--space-6)'}}>
              {pending.map(p => <Badge key={p} tone="closed" shape="square">{p}</Badge>)}
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'var(--space-4)',marginTop:'var(--space-8)',
          paddingTop:'var(--space-6)',borderTop:'1px solid var(--line)',flexWrap:'wrap'}}>
          <span style={{font:'var(--type-label)',textTransform:'uppercase',
            letterSpacing:'var(--tracking-label)',color:'var(--text-muted)'}}>Snooze instead</span>
          {SNOOZE_OPTIONS.slice(0,4).map(o => (
            <Button key={o.value} size="sm" onClick={() => onSnooze(o.value)}>{o.label}</Button>
          ))}
          <Button size="sm" variant="ghost" style={{marginLeft:'auto'}} onClick={onCancel}>Cancel</Button>
        </div>
      </Panel>
    </div>
  )
}
