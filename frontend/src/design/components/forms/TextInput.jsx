import { Icon } from '../core/Icon.jsx'

const CSS = `
.nc-input{display:flex;align-items:center;gap:var(--space-3);height:var(--control-height);
  padding:0 var(--space-4);background:var(--surface-sunken);border:1px solid var(--line-strong);
  border-radius:var(--radius-sm);transition:var(--transition-control)}
.nc-input:hover{border-color:var(--line-accent)}
.nc-input:focus-within{border-color:var(--accent);box-shadow:var(--ring-focus)}
.nc-input input{flex:1;min-width:0;background:none;border:0;outline:none;color:var(--text-primary);
  font:var(--type-mono)}
.nc-input input::placeholder{color:var(--text-muted);font-family:var(--font-sans)}
.nc-input--invalid{border-color:var(--danger)}
.nc-input--disabled{opacity:.45}
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

export function TextInput({ value, onChange, placeholder, icon, suffix, invalid, disabled, width, style, ...rest }) {
  const cls = ['nc-input', invalid && 'nc-input--invalid', disabled && 'nc-input--disabled'].filter(Boolean).join(' ')
  return (
    <label className={cls} style={{ width, ...style }}>
      {icon && <Icon name={icon} size={14} color="var(--text-muted)" />}
      <input value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} {...rest} />
      {suffix && <span style={{ font: 'var(--type-small)', color: 'var(--text-muted)' }}>{suffix}</span>}
    </label>
  )
}
