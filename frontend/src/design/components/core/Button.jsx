import { Icon } from './Icon.jsx'

const CSS = `
.nc-btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-3);
  height:var(--control-height);padding:0 var(--pad-control-x);border-radius:var(--radius-sm);
  border:1px solid transparent;font:var(--type-body-strong);letter-spacing:var(--tracking-tight);
  cursor:pointer;white-space:nowrap;transition:var(--transition-control);
  -webkit-user-select:none;user-select:none}
.nc-btn:focus-visible{outline:none;box-shadow:var(--ring-focus)}
.nc-btn:disabled{opacity:.4;cursor:not-allowed}
.nc-btn--lg{height:var(--control-height-lg);padding:0 var(--space-6);font-size:var(--text-md)}
.nc-btn--sm{height:24px;padding:0 var(--space-4);font-size:var(--text-xs)}
.nc-btn--primary{background:var(--accent);color:var(--text-on-accent)}
.nc-btn--primary:hover:not(:disabled){background:var(--accent-hover)}
.nc-btn--primary:active:not(:disabled){background:var(--accent-press)}
.nc-btn--secondary{background:var(--surface-raised);color:var(--text-primary);border-color:var(--line-strong);box-shadow:var(--shadow-edge-top)}
.nc-btn--secondary:hover:not(:disabled){background:var(--surface-hover);border-color:var(--moonlight-a32)}
.nc-btn--secondary:active:not(:disabled){background:var(--surface-sunken)}
.nc-btn--ghost{background:transparent;color:var(--text-secondary)}
.nc-btn--ghost:hover:not(:disabled){background:var(--surface-hover);color:var(--text-primary)}
.nc-btn--danger{background:transparent;color:var(--danger);border-color:color-mix(in oklch,var(--danger) 40%,transparent)}
.nc-btn--danger:hover:not(:disabled){background:var(--ember-a12);color:var(--danger-hover)}
.nc-btn--block{width:100%}
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

export function Button({
  variant = 'secondary', size = 'md', icon, iconRight, block = false,
  children, className = '', ...rest
}) {
  const cls = ['nc-btn', 'nc-btn--' + variant, size !== 'md' && 'nc-btn--' + size,
    block && 'nc-btn--block', className].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 13 : 15} />}
    </button>
  )
}
