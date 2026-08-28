import type { SelectHTMLAttributes } from 'react'
import { Icon } from '../core/Icon'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'width'> {
  options: SelectOption[]
  /** Rendered as an empty-value first option — used for action menus like "Snooze…". */
  placeholder?: string
  width?: number | string
}


const CSS = `
.nc-select{position:relative;display:inline-flex;align-items:center;height:var(--control-height);
  background:var(--surface-raised);border:1px solid var(--line-strong);border-radius:var(--radius-sm);
  box-shadow:var(--shadow-edge-top);transition:var(--transition-control)}
.nc-select:hover{border-color:var(--line-accent)}
.nc-select:focus-within{border-color:var(--accent);box-shadow:var(--ring-focus)}
.nc-select select{appearance:none;background:none;border:0;outline:none;color:var(--text-primary);
  font:var(--type-body-strong);padding:0 var(--space-8) 0 var(--space-4);height:100%;cursor:pointer}
.nc-select__chev{position:absolute;right:var(--space-4);pointer-events:none}
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

export function Select({ value, onChange, options = [], placeholder, width, disabled, style, ...rest }: SelectProps) {
  return (
    <div className="nc-select" style={{ width, opacity: disabled ? 0.45 : 1, ...style }}>
      <select value={value} onChange={onChange} disabled={disabled} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={String(o.value)} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon className="nc-select__chev" name="chevron-down" size={13} color="var(--text-muted)" />
    </div>
  )
}
