# UI kit — nightcap desktop app

**These views are the live app UI.** `src/App.tsx` is the shell that owns the state and the Go
bindings; everything below is a presentational view it renders with real `Status` / `Config` data.

They started as a recreation of the nightcap window in a **proposed** visual direction — the design
brief asked for a direction, not a copy of the then-shipped UI — imported from the claude.ai/design
project `nightcap Design System` (`ui_kits/desktop/`). The source files were written for a
Babel-in-the-browser preview: global `React`, `window.NightcapDesignSystem_*`, `window.AppShell`,
`window.mmss`. They are ES modules here, and the preview harness (`index.html`, `ds-base.js`,
`support.js`) was not imported — Vite replaces it.

## What changed from the old UI

| Old (App.tsx before the port) | Now | Why |
| --- | --- | --- |
| One 900px scrolling column of four stacked sections | 216px sidebar + single scrolling view | The four sections are four different jobs; stacking them buries the watchlist |
| `#11131a` slate + Nunito, no brand colour | `--night` / `--surface-tile` + moonlight & amber from the 2b asset pack | The UI never used the brand palette it already owns |
| Status as two grey pills in a header | Persistent status foot in the sidebar: mark state, armed count, idle meter, pause switch | The one thing you open the app to check |
| HTML `<table>` rows | 44px `ListRow` with a state `Badge` in a fixed leading slot | Scannable at a glance; state is colour-coded |
| Countdown as an `<h2>` in a centred card | `CountdownRing` + snooze row + explicit "unsaved work will be lost" | This is the only destructive moment in the product |
| Kill history hidden at the bottom | Its own "Closed" view | It is the app's receipt |

## Files

- `AwakeView.tsx` — wake-lock holders + the un-closable driver/service list. Takes `Status.error`
  and shows it *instead of* the empty state: "I couldn't check" is not "nothing is keeping you awake".
- `WatchlistView.tsx` — per-app timeouts, snooze, remove, free-text add.
- `HistoryView.tsx` — "Closed by nightcap".
- `SettingsView.tsx` — rules, startup, pause, config path.
- `WarningOverlay.tsx` — the pre-terminate countdown. Snooze only; there is no cancel binding.
- `kit.css` — `.win` / `.nav` / `.scroll` window chrome.

Every visual primitive comes from `../components/`; nothing is re-implemented here. The views hold no
state and call no bindings — they take data and callbacks from `App.tsx`, which is where `whenReady()`
and `call()` live.

### Orphaned since the port

- `mock.ts` — fake `Status` / `Config` payloads. Its only consumer was the demo `AppShell`, deleted
  when `App.tsx` took over. Kept as a reference for what the boundary looks like; delete it if you
  don't want it.
- `TrayMenu.tsx` — a popover mock-up of the Windows tray menu. The real menu is native, built with
  `systray` in `main.go`, so nothing renders this.
