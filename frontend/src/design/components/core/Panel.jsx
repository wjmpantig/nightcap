export function Panel({ tone = 'default', pad = true, children, style, ...rest }) {
  const tones = {
    default: { background: 'var(--surface-panel)', borderColor: 'var(--line)' },
    sunken: { background: 'var(--surface-sunken)', borderColor: 'var(--line)' },
    accent: { background: 'var(--surface-panel)', borderColor: 'var(--line-accent)', boxShadow: 'var(--glow-moon)' },
    quiet: { background: 'transparent', borderColor: 'var(--line)' },
  }
  return (
    <section
      {...rest}
      style={{
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-panel), var(--shadow-edge-top)',
        padding: pad ? 'var(--pad-panel)' : 0,
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </section>
  )
}
