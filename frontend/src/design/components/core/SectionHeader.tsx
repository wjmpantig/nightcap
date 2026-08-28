import type { HTMLAttributes, ReactNode } from 'react'

export interface SectionHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Sentence-case label; rendered uppercase with 0.08em tracking. */
  title: string
  /** Row count, shown in mono next to the title. */
  count?: number | string
  hint?: ReactNode
  /** Buttons pushed to the right edge. */
  actions?: ReactNode
}

export function SectionHeader({ title, count, hint, actions, style, ...rest }: SectionHeaderProps) {
  return (
    <header
      {...rest}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
        padding: 'var(--space-5) var(--pad-panel)',
        borderBottom: '1px solid var(--line)', ...style,
      }}
    >
      <h2 style={{
        font: 'var(--type-label)', textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-label)', color: 'var(--text-muted)',
        fontFamily: 'var(--font-sans)',
      }}>{title}</h2>
      {count != null && (
        <span style={{ font: 'var(--type-mono-sm)', color: 'var(--text-muted)' }}>{count}</span>
      )}
      {hint && (
        <span style={{ font: 'var(--type-small)', color: 'var(--text-muted)' }}>{hint}</span>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--gap-control)' }}>{actions}</div>
    </header>
  )
}
