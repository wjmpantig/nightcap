import { createElement, useEffect, useState } from 'react'

// Lucide, loaded once from the CDN as a script (see design/README.md → Iconography) and rendered as
// a real inline <svg> so the glyph inherits currentColor. Icon geometry is Lucide's, never redrawn.
const SRC = 'https://unpkg.com/lucide@0.474.0/dist/umd/lucide.js'
const subs = new Set()
let loading = false

function ensureLucide() {
  if (typeof document === 'undefined' || window.lucide || loading) return
  loading = true
  const s = document.createElement('script')
  s.src = SRC
  s.crossOrigin = 'anonymous'
  s.onload = () => subs.forEach(fn => fn())
  document.head.appendChild(s)
}

function pascal(name) {
  return String(name).split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

const CAMEL = {
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule',
  'stroke-dasharray': 'strokeDasharray',
}
function reactAttrs(attrs = {}) {
  const out = {}
  for (const k in attrs) out[CAMEL[k] || k] = attrs[k]
  return out
}

export function Icon({ name, size = 16, color = 'currentColor', style, ...rest }) {
  const [, bump] = useState(0)
  useEffect(() => {
    if (window.lucide) return
    const fn = () => bump(n => n + 1)
    subs.add(fn)
    ensureLucide()
    return () => subs.delete(fn)
  }, [])
  ensureLucide()

  // lucide UMD hands back an IconNode: ['svg', attrs, [[tag, attrs], …]]
  const L = typeof window !== 'undefined' ? window.lucide : null
  const node = L ? (L.icons && L.icons[pascal(name)]) || L[pascal(name)] : null
  const parts = Array.isArray(node) ? (node[0] === 'svg' ? node[2] : node) : null
  const children = Array.isArray(parts)
    ? parts.map(([tag, attrs], i) => createElement(tag, { key: i, ...reactAttrs(attrs) }))
    : null

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={rest['aria-label'] ? undefined : true}
      {...rest}
      style={{ display: 'inline-block', flex: '0 0 auto', verticalAlign: 'middle', ...style }}
    >
      {children}
    </svg>
  )
}
