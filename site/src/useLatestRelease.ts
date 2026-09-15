import { useEffect, useState } from "react"
import { links } from "./links"

/**
 * The newest release's tag, or null. A rate-limited, blocked or offline visitor
 * gets null and the page simply omits the version — the same fail-quiet rule
 * the app's own update check follows.
 */
export function useLatestRelease(): string | null {
  const [tag, setTag] = useState<string | null>(null)

  useEffect(() => {
    const abort = new AbortController()
    fetch(links.api, { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        const name = body?.tag_name
        if (typeof name === "string" && name) setTag(name)
      })
      .catch(() => {})
    return () => abort.abort()
  }, [])

  return tag
}
