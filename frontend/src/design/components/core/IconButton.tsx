import type { ButtonHTMLAttributes } from 'react'
import { Icon } from './Icon'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Lucide icon name. */
  icon: string
  /** Required — becomes both aria-label and the native tooltip. */
  label: string
  /** Square edge length in px. 24 dense, 28 default, 32 titlebar. */
  size?: number
  variant?: 'ghost' | 'outlined' | 'danger' | 'close'
}


const CSS = `
.nc-iconbtn{display:inline-flex;align-items:center;justify-content:center;
  border-radius:var(--radius-sm);border:1px solid transparent;background:transparent;
  color:var(--text-secondary);cursor:pointer;transition:var(--transition-control)}
.nc-iconbtn:hover:not(:disabled){background:var(--surface-hover);color:var(--text-primary)}
.nc-iconbtn:active:not(:disabled){background:var(--surface-sunken)}
.nc-iconbtn:focus-visible{outline:none;box-shadow:var(--ring-focus)}
.nc-iconbtn:disabled{opacity:.4;cursor:not-allowed}
.nc-iconbtn--outlined{border-color:var(--line-strong);background:var(--surface-raised)}
.nc-iconbtn--danger:hover:not(:disabled){background:var(--ember-a12);color:var(--danger)}
.nc-iconbtn--close:hover:not(:disabled){background:var(--ember-a12);color:var(--danger)}
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

export function IconButton({ icon, label, size = 28, variant = 'ghost', className = '', ...rest }: IconButtonProps) {
  const cls = ['nc-iconbtn', 'nc-iconbtn--' + variant, className].filter(Boolean).join(' ')
  return (
    <button type="button" aria-label={label} title={label} className={cls}
      style={{ width: size, height: size }} {...rest}>
      <Icon name={icon} size={Math.round(size * 0.56)} />
    </button>
  )
}
