// Presentation rules that both App.tsx and the design/kit views need.
// Durations are always "Xm SSs" in mono, never "22 minutes" — see design/README.md.

import type { Request, WatchEntry } from "./types"

/** Snooze durations cross the Go boundary as minutes: 0 un-snoozes, negative means indefinitely. */
export const SNOOZE_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 60, label: "1 hour" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
  { value: -1, label: "Until I un-snooze" },
]

export function mmss(secs: number) {
  const s = Math.max(0, Math.round(secs))
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
}

/** Kill timestamps: time alone for today, "Aug 28 02:14" otherwise. "" if unparseable. */
export function whenKilled(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const sameDay = d.toDateString() === new Date().toDateString()
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  return sameDay ? time : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`
}

export function humanRemaining(ms: number) {
  const mins = Math.round(ms / 60000)
  if (mins > 60 * 24 * 365) return "indefinitely"
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`
  return `${Math.max(1, mins)}m`
}

/**
 * Milliseconds of snooze left, 0 when not snoozed. Go's zero time arrives as a
 * real date string ("0001-01-01T00:00:00Z"), so a truthiness check on
 * snoozedUntil is not enough — the comparison against now is what decides.
 */
export function snoozeRemaining(entry: WatchEntry, nowMs: number): number {
  const until = new Date(entry.snoozedUntil).getTime()
  if (!until || Number.isNaN(until)) return 0
  return Math.max(0, until - nowMs)
}

/**
 * What the user can actually watch for this request. A shared runtime
 * (msedgewebview2.exe and friends) is never watchable itself — its name belongs
 * to several unrelated apps at once, nightcap's own window included — so the
 * resolved owners are the real targets. This mirrors Request.targets() in Go.
 */
export function targetsOf(r: Request): string[] {
  return r.hosts.length > 0 ? r.hosts : [r.exe]
}
