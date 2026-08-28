import type { HTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: 'info' | 'warning' | 'error'
  title?: ReactNode
  /** Buttons rendered at the right edge. */
  action?: ReactNode
  onDismiss?: () => void
}


const TONES = {
  info: { color: 'var(--text-accent)', bg: 'var(--moonlight-a08)', border: 'var(--moonlight-a32)', icon: 'info' },
  warning: { color: 'var(--state-awake)', bg: 'var(--amber-a12)', border: 'color-mix(in oklch,var(--state-awake) 28%,transparent)', icon: 'triangle-alert' },
  error: { color: 'var(--danger)', bg: 'var(--ember-a12)', border: 'color-mix(in oklch,var(--danger) 32%,transparent)', icon: 'shield-alert' },
}

export function Banner({ tone = 'info', title, children, action, onDismiss, style, ...rest }: BannerProps) {
  const t = TONES[tone] || TONES.info
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      {...rest}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)',
        padding: 'var(--space-5) var(--space-6)', borderRadius: 'var(--radius-md)',
        background: t.bg, border: '1px solid ' + t.border, ...style,
      }}
    >
      <Icon name={t.icon} size={16} color={t.color} style={{ marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ font: 'var(--type-body-strong)', color: t.color, marginBottom: children ? 'var(--space-1)' : 0 }}>{title}</div>
        )}
        {children && <div style={{ font: 'var(--type-body)', color: 'var(--text-secondary)' }}>{children}</div>}
      </div>
      {action}
      {onDismiss && <IconButton icon="x" label="Dismiss" size={24} onClick={onDismiss} />}
    </div>
  )
}
