import type { HTMLAttributes } from 'react'

export interface CountdownRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Seconds left. */
  remaining: number
  /** Seconds the countdown started from (the configured warning window). */
  total: number
  size?: number
  /** Stroke colour. Defaults to --state-closed. */
  tone?: string
}

// Linear ring — a countdown must be readable as time, so no easing and no pulse.
export function CountdownRing({ remaining, total, size = 84, tone = 'var(--state-closed)', style, ...rest }: CountdownRingProps) {
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const secs = Math.max(0, Math.round(remaining))
  return (
    <div {...rest} style={{ position: 'relative', width: size, height: size, flex: '0 0 auto', ...style }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--night-700)" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset var(--dur-tick) linear' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1,
      }}>
        <span style={{ font: 'var(--type-numeric)', fontSize: size * 0.3, color: tone }}>{secs}</span>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>sec</span>
      </div>
    </div>
  )
}
