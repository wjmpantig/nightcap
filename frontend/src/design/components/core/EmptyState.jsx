import { Icon } from './Icon.jsx'

export function EmptyState({ icon = 'moon', title, children, action, style, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 'var(--space-4)', padding: 'var(--space-10) var(--space-6)',
        textAlign: 'center', ...style,
      }}
    >
      <Icon name={icon} size={22} color="var(--state-locked)" />
      <div style={{ font: 'var(--type-body-strong)', color: 'var(--text-secondary)' }}>{title}</div>
      {children && (
        <div style={{ font: 'var(--type-small)', color: 'var(--text-muted)', maxWidth: 380 }}>{children}</div>
      )}
      {action}
    </div>
  )
}
