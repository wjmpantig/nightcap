const CSS = `
.nc-switch{display:inline-flex;align-items:center;gap:var(--space-5);cursor:pointer;
  font:var(--type-body-strong);color:var(--text-primary)}
.nc-switch input{position:absolute;opacity:0;width:0;height:0}
.nc-switch__track{position:relative;width:34px;height:18px;flex:0 0 auto;border-radius:var(--radius-pill);
  background:var(--night-600);border:1px solid var(--line-strong);transition:var(--transition-control)}
.nc-switch__knob{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;
  background:var(--text-secondary);transition:transform var(--dur-fast) var(--ease-out),background var(--dur-fast) var(--ease-out)}
.nc-switch input:checked+.nc-switch__track{background:var(--accent);border-color:var(--accent)}
.nc-switch input:checked+.nc-switch__track .nc-switch__knob{transform:translateX(16px);background:var(--text-on-accent)}
.nc-switch input:focus-visible+.nc-switch__track{box-shadow:var(--ring-focus)}
.nc-switch--amber input:checked+.nc-switch__track{background:var(--state-awake);border-color:var(--state-awake)}
.nc-switch--disabled{opacity:.45;cursor:not-allowed}
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

export function Switch({ checked, onChange, label, tone = 'accent', disabled, style, ...rest }) {
  const cls = ['nc-switch', tone === 'amber' && 'nc-switch--amber', disabled && 'nc-switch--disabled']
    .filter(Boolean).join(' ')
  return (
    <label className={cls} style={style}>
      <input type="checkbox" role="switch" checked={!!checked} onChange={onChange} disabled={disabled} {...rest} />
      <span className="nc-switch__track"><span className="nc-switch__knob" /></span>
      {label}
    </label>
  )
}
