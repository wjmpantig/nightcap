import { Icon } from '../core/Icon.jsx'

export function ProcessName({ exe, hosts = [], path, size = 'md', style, ...rest }) {
  const shared = hosts.length > 1
  return (
    <div {...rest} style={{ minWidth: 0, ...style }}>
      <div style={{
        font: size === 'sm' ? 'var(--type-mono-sm)' : 'var(--type-mono)',
        color: 'var(--text-primary)', letterSpacing: '-0.01em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={path || exe}>{exe}</div>
      {hosts.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          font: 'var(--type-small)', color: 'var(--text-muted)', marginTop: 2,
        }}>
          {shared && <Icon name="git-fork" size={11} color="var(--state-locked)" />}
          <span>{shared ? 'shared runtime, owned by ' : 'owned by '}{hosts.join(', ')}</span>
        </div>
      )}
    </div>
  )
}
