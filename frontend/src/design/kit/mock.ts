// Fake payloads for the design kit, shaped like the real Go Status/Config.
// The types and the formatters live in src/types.ts and src/format.ts — the app
// and the kit share them.

import type { KillRecord, Request, WatchEntry } from "../../types"

export const REQUESTS: Request[] = [
  {
    exe: "vlc.exe",
    path: "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
    kind: "PROCESS",
    category: "DISPLAY",
    reason: "Video playback in progress.",
    hosts: [],
  },
  {
    exe: "msedgewebview2.exe",
    path: "C:\\Program Files (x86)\\Microsoft\\EdgeWebView\\msedgewebview2.exe",
    kind: "PROCESS",
    category: "EXECUTION",
    reason: "Media playback",
    hosts: ["Widgets.exe", "GoogleDriveFS.exe"],
  },
  {
    exe: "Teams.exe",
    path: "C:\\Users\\sam\\AppData\\Local\\Microsoft\\Teams\\Teams.exe",
    kind: "PROCESS",
    category: "EXECUTION",
    reason: "A call is in progress.",
    hosts: [],
  },
  {
    exe: "steam.exe",
    path: "C:\\Program Files (x86)\\Steam\\steam.exe",
    kind: "PROCESS",
    category: "SYSTEM",
    reason: "Downloading content.",
    hosts: [],
  },
  {
    exe: "",
    path: "",
    kind: "DRIVER",
    category: "DRIVER",
    reason: "An audio stream is active. (Realtek HD Audio)",
    hosts: [],
  },
  {
    exe: "",
    path: "",
    kind: "DRIVER",
    category: "DRIVER",
    reason: "Legacy kernel caller",
    hosts: [],
  },
]

export const WATCHLIST: WatchEntry[] = [
  { exe: "vlc.exe", timeoutMinutes: 0, snoozedUntil: "" },
  { exe: "Widgets.exe", timeoutMinutes: 5, snoozedUntil: "" },
  {
    exe: "Teams.exe",
    timeoutMinutes: 0,
    snoozedUntil: new Date(Date.now() + 3.66 * 3600e3).toISOString(),
  },
  { exe: "steam.exe", timeoutMinutes: 45, snoozedUntil: "" },
]

export const HISTORY: KillRecord[] = [
  {
    exe: "vlc.exe",
    at: "2026-08-28T02:14:00",
    idleSecs: 1320,
    category: "DISPLAY",
    reason: "Video playback in progress.",
  },
  {
    exe: "Widgets.exe",
    at: "2026-08-27T03:41:00",
    idleSecs: 960,
    category: "EXECUTION",
    reason: "Media playback",
  },
  {
    exe: "steam.exe",
    at: "2026-08-26T04:02:00",
    idleSecs: 2760,
    category: "SYSTEM",
    reason: "Downloading content.",
  },
  {
    exe: "vlc.exe",
    at: "2026-08-25T01:58:00",
    idleSecs: 900,
    category: "DISPLAY",
    reason: "Video playback in progress.",
  },
]
