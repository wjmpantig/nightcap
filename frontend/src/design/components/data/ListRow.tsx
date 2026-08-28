import type { HTMLAttributes, ReactNode } from 'react'

export interface ListRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed-width status slot: a Badge, Mark or state dot. */
  leading?: ReactNode
  /** Right-aligned secondary text (timestamps, "after 22m idle"). */
  meta?: ReactNode
  /** Controls pinned to the right edge. */
  actions?: ReactNode
  selected?: boolean
  /** Dims the row — used for snoozed entries. */
  muted?: boolean
  interactive?: boolean
}

const CSS = `
.nc-row{display:flex;align-items:center;gap:var(--space-5);min-height:var(--row-height);
  padding:var(--space-3) var(--pad-panel);border-top:1px solid var(--line);
  transition:background-color var(--dur-fast) var(--ease-out)}
.nc-row:first-child{border-top:0}
.nc-row--hover:hover{background:var(--surface-hover)}
.nc-row--selected{background:var(--surface-selected);box-shadow:inset 2px 0 0 var(--accent)}
.nc-row--muted{opacity:.55}
.nc-row__actions{margin-left:auto;display:flex;align-items:center;gap:var(--space-4)}
`
let injected = false
function inject() {
  if (injected || typeof document === 'undefined') return
  injected = true
  const el = document.createElement('style')
  el.textContent = CSS
  document.head.appendChild(el)
}
inject()

export function ListRow({ leading, children, meta, actions, selected, muted, interactive = true, style, ...rest }: ListRowProps) {
  const cls = ['nc-row', interactive && 'nc-row--hover', selected && 'nc-row--selected',
    muted && 'nc-row--muted'].filter(Boolean).join(' ')
  return (
    <div className={cls} style={style} {...rest}>
      {leading}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {meta && <div style={{ font: 'var(--type-small)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{meta}</div>}
      {actions && <div className="nc-row__actions">{actions}</div>}
    </div>
  )
}
