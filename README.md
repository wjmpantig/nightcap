# nightcap

Some apps hold a Windows power request and forget to let go, so the PC never sleeps. nightcap shows
you who's doing it, lets you put the repeat offenders on a watchlist, and force-closes them once the
machine has genuinely been idle long enough.

Windows only for now. Go + Wails v2 + React.

## What it does

1. Polls `powercfg /requests` every 5 seconds to see what is holding the machine awake.
2. Tracks how long since your last keyboard or mouse input.
3. If a **watchlisted** app is holding a wake lock and you've been idle past its timeout, it warns
   you with a countdown, then terminates the process.

A fullscreen app normally gets a pass on the idle timer — but not if it's on the watchlist.
Watchlisting something is an explicit "no exceptions", otherwise a media player stuck on a paused
video could never be caught, which is the whole reason this exists.

## Requires administrator

`powercfg /requests` only reports the full picture when elevated, so nightcap ships with a
`requireAdministrator` manifest and prompts for UAC on launch. Run unelevated and it tells you it
needs admin rather than pretending nothing is keeping you awake.

"Start nightcap at login" registers a scheduled task with `/rl HIGHEST` rather than a `Run`
registry key — a `Run` entry cannot launch an elevated app and fails silently.

## Settings

| Setting | Meaning |
| --- | --- |
| Idle timeout | How long with no input before a watched app is closed. Default 15 minutes. |
| Per-app timeout | Overrides the global timeout for one app. Blank = use the global. |
| Warning | Seconds of countdown before the kill. Default 30. |
| Snooze | Pause watching one app for 15m / 1h / 4h / 8h / indefinitely, without removing it from the watchlist. Survives a restart. |
| Pause watching | Stops everything, watchlist intact. Also in the tray menu. |

The **Closed by nightcap** section lists what got killed, when, how long you'd been idle, and the
reason the app gave for holding the lock — so you can find out what died overnight. It keeps the
last 200 kills and has a Clear button.

Config lives at `%APPDATA%\nightcap\config.json`. It's plain JSON and safe to hand-edit; anything
missing or nonsensical falls back to defaults rather than crashing.

## Shared runtimes

`powercfg` names wake-lock holders by image path and **never by PID**, which is a problem when the
holder is something like `msedgewebview2.exe` — a typical desktop runs several independent WebView2
trees owned by Search, Widgets, Google Drive and so on. Closing "msedgewebview2.exe" by name would
close all of them.

nightcap walks the parent chain to the owning application instead (renderer to browser process to
host, since a WebView2's parent is usually another WebView2) and shows it as `msedgewebview2.exe —
owned by Widgets.exe`. You watchlist **Widgets.exe**; nightcap closes that process and its
descendants and leaves the other trees alone. Watchlisting a shared runtime by name is refused.

Because there is no PID in the powercfg output, when several apps embed the same runtime nightcap
cannot tell which one holds the lock, and says so by listing every owner. Watchlisting one of them
means "if this app is running a webview and some webview is holding a wake lock, close it".

The same treatment applies to `dllhost.exe`, `rundll32.exe`, `java.exe`, `node.exe`, `python.exe`
and friends. Parent links are validated against process creation times, so a recycled PID cannot
make nightcap blame the wrong app.

## Safety

- A short denylist (`lsass.exe`, `csrss.exe`, `winlogon.exe`, …) is never terminated. nightcap runs
  elevated and the watchlist is free text, so this guard is not optional.
- Wake locks held by **drivers and services** are shown but can't be closed — there's no process to
  terminate.
- Termination covers the process **and its descendants**, so an app's orphaned children can't keep
  holding the lock it was closed for. The walk stops at protected processes.
- Termination is a hard `TerminateProcess`. Unsaved work in a watched app is lost; that's what the
  warning countdown and snooze are for.

## Development

```sh
go install github.com/wailsapp/wails/v2/cmd/wails@latest

wails dev      # run from an ELEVATED terminal, or you'll only see the "needs admin" state
wails build    # produces build/bin/nightcap.exe
go test ./...
```

### Layout

| File | Purpose |
| --- | --- |
| `watcher.go` | The loop, and `decide()` — the kill rules, pure and platform-free |
| `power.go` | `powercfg /requests` parser (no syscalls, so it's testable) |
| `power_windows.go` | Runs powercfg, detects the unprivileged case |
| `idle_windows.go` | `GetLastInputInfo`, fullscreen detection |
| `host.go` | Parent-chain walking, owner resolution, process trees (pure, testable) |
| `proc_windows.go` | Process enumeration and termination, protected-process guard |
| `config.go` | Types and `%APPDATA%` persistence |
| `app.go` | Methods bound into the frontend |
| `frontend/src/App.tsx` | The whole UI |

`decide(now, snapshot, config)` takes the clock as an argument and touches no I/O, which is what
makes the rules testable without Windows or a real idle machine.

## Not in v1

- Graceful `WM_CLOSE` before terminating.
- Linux/macOS. The three `_windows.go` files are the entire port surface.
