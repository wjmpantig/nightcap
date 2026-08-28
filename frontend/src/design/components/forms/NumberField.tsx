import type { InputHTMLAttributes } from "react"

/**
 * Numeric field with a unit label. Every timeout in nightcap is entered through this.
 */
export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "width" | "type"> {
  /** Unit suffix, e.g. "min" or "sec". */
  unit?: string
  width?: number | string
}

const CSS = `
.nc-num{display:inline-flex;align-items:center;gap:var(--space-3);height:var(--control-height);
  padding:0 var(--space-4);background:var(--surface-sunken);border:1px solid var(--line-strong);
  border-radius:var(--radius-sm);transition:var(--transition-control)}
.nc-num:hover{border-color:var(--line-accent)}
.nc-num:focus-within{border-color:var(--accent);box-shadow:var(--ring-focus)}
.nc-num input{width:100%;background:none;border:0;outline:none;color:var(--text-primary);
  font:var(--type-mono);text-align:right;-moz-appearance:textfield}
.nc-num input::-webkit-outer-spin-button,.nc-num input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.nc-num input::placeholder{color:var(--text-muted)}
.nc-num__unit{font:var(--type-small);color:var(--text-muted);white-space:nowrap}
`
let injected = false
function inject() {
  if (injected || typeof document === "undefined") return
  injected = true
  const el = document.createElement("style")
  el.textContent = CSS
  document.head.appendChild(el)
}
inject()

export function NumberField({
  value,
  onChange,
  unit,
  placeholder,
  min = 1,
  max,
  width = 92,
  disabled,
  style,
  ...rest
}: NumberFieldProps) {
  return (
    <label className="nc-num" style={{ width, opacity: disabled ? 0.45 : 1, ...style }}>
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        {...rest}
      />
      {unit && <span className="nc-num__unit">{unit}</span>}
    </label>
  )
}
