# UI kit — nightcap desktop app

A recreation of the nightcap window in the **new** visual direction (the design brief asked for a
proposed look, not a copy of the shipped `frontend/src/App.tsx`). Content, states and copy come from
the real app; the layout is the proposal.

Imported from the claude.ai/design project `nightcap Design System` (`ui_kits/desktop/`). The source
files were written for a Babel-in-the-browser preview — global `React`, `window.NightcapDesignSystem_*`,
`window.AppShell`. They are ES modules here: named imports from `../components/**`, mock payloads from
`./mock.ts`, shell chrome in `./kit.css`. The preview harness (`index.html`, `ds-base.js`,
`support.js`) was not imported; Vite replaces it.

## What changed from the shipped UI

| Shipped (App.tsx) | Proposed here | Why |
| --- | --- | --- |
| One 900px scrolling column of four stacked sections | 1000×640 window, 216px sidebar + single scrolling view | The four sections are four different jobs; stacking them buries the watchlist |
| `#11131a` slate + Nunito, no brand colour | `--night` / `--surface-tile` + moonlight & amber from the 2b asset pack | The UI never used the brand palette it already owns |
| Status as two grey pills in a header | Persistent status foot in the sidebar: mark state, armed count, idle meter, pause switch | The one thing you open the app to check |
| HTML `<table>` rows | 44px `ListRow` with a state `Badge` in a fixed leading slot | Scannable at a glance; state is colour-coded |
| Countdown as an `<h2>` in a centred card | `CountdownRing` + snooze row + explicit "unsaved work will be lost" | This is the only destructive moment in the product |
| Kill history hidden at the bottom | Its own "Closed" view | It is the app's receipt |

## Files

- `AppShell.tsx` — window chrome, sidebar nav, status foot, state. Also the demo's "Simulate kill".
- `AwakeView.tsx` — wake-lock holders + the un-closable driver/service list.
- `WatchlistView.tsx` — per-app timeouts, snooze, remove, free-text add.
- `HistoryView.tsx` — "Closed by nightcap".
- `SettingsView.tsx` — rules, startup, pause, config path.
- `WarningOverlay.tsx` — the pre-terminate countdown.
- `TrayMenu.tsx` — the tray popover (Windows tray menu equivalent).
- `mock.ts` — fake payloads shaped like the Go `Status` / `Config` structs.
- `kit.css` — `.win` / `.nav` / `.scroll` window chrome.

Every visual primitive comes from `../components/`; nothing is re-implemented here.

**Nothing in this folder is wired to the Go backend.** It renders mock data only — the real bridge is
`src/bridge.ts`. Swapping `App.tsx` onto this shell is a separate job.
