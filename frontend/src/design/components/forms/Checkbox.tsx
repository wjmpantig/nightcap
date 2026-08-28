import type { InputHTMLAttributes, ReactNode } from "react"
import { Icon } from "../core/Icon"

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  /** Second line explaining the consequence of the setting. */
  hint?: ReactNode
}

const CSS = `
.nc-check{display:inline-flex;align-items:flex-start;gap:var(--space-4);cursor:pointer;
  font:var(--type-body);color:var(--text-primary)}
.nc-check input{position:absolute;opacity:0;width:0;height:0}
.nc-check__box{display:flex;align-items:center;justify-content:center;width:16px;height:16px;
  margin-top:1px;flex:0 0 auto;border:1px solid var(--line-strong);border-radius:var(--radius-xs);
  background:var(--surface-sunken);transition:var(--transition-control)}
.nc-check:hover .nc-check__box{border-color:var(--line-accent)}
.nc-check input:checked+.nc-check__box{background:var(--accent);border-color:var(--accent);color:var(--text-on-accent)}
.nc-check input:focus-visible+.nc-check__box{box-shadow:var(--ring-focus)}
.nc-check__hint{display:block;font:var(--type-small);color:var(--text-muted);margin-top:2px}
.nc-check--disabled{opacity:.45;cursor:not-allowed}
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

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
  style,
  ...rest
}: CheckboxProps) {
  return (
    <label className={`nc-check${disabled ? " nc-check--disabled" : ""}`} style={style}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className="nc-check__box">{checked && <Icon name="check" size={11} />}</span>
      <span>
        {label}
        {hint && <span className="nc-check__hint">{hint}</span>}
      </span>
    </label>
  )
}
