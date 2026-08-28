# CLAUDE.md

Wake watcher for Windows: finds apps holding power requests and force-closes watchlisted ones after
the machine has been idle too long. Go + Wails v2 + React. See README.md for user-facing behaviour.

## Commands

```sh
wails dev            # needs an ELEVATED terminal, else you only get the "needs admin" state
wails build          # build/bin/nightcap.exe
go test ./...        # all logic tests; run before claiming anything works
gofmt -l .           # must print nothing
```

`wails build` regenerates `frontend/wailsjs/`. Never hand-edit those files. If you add or rename a
bound method on `App`, run a build before touching the TSX or the import will not exist yet.

## Architecture rules

**All kill logic lives in `decide()` in `watcher.go`.** It is pure: it takes `now`, a `Snapshot`,
and a `Config`, and touches no clock, syscalls, or I/O. Every behaviour change to *when* something
gets killed belongs there, with a case in `TestDecide`. Don't smuggle rules into the tick loop or
the UI — those are plumbing.

Platform code is confined to three files, which are also the whole port surface for Linux/macOS:

- `power_windows.go` — runs powercfg. Parsing lives in `power.go` with no build tag so it's testable.
- `idle_windows.go` — `GetLastInputInfo`, fullscreen detection.
- `proc_windows.go` — Toolhelp32 enumeration, `TerminateProcess`, process-table snapshot.

`host.go` is platform-free (pure functions over a `map[uint32]procInfo`) and holds the parent-chain
logic, so it is testable without Windows.

`watcher` holds `sample`, `kill`, and `now` as fields so tests can inject them. Use that instead of
adding build tags or mocking frameworks.

## Things that will bite you

- **The fullscreen rule is not a blanket exemption.** Fullscreen pauses the idle timer only for apps
  that are *not* watchlisted. A watched app holding a wake lock gets killed regardless. This is
  deliberate and there are tests for it; don't "fix" it.
- **Snoozed entries are invisible to the fullscreen rule too.** A snoozed app must not lend its
  exemption to anything else.
- **Idle time is 32-bit tick arithmetic.** `idleTime()` subtracts in `uint32` on purpose so it stays
  correct across the ~49.7 day `GetTickCount` wrap. Widening those to `int64` reintroduces the bug.
- **`protected` in `proc_windows.go` is a safety guard, not a nicety.** nightcap runs elevated and
  the watchlist is free text; killing `lsass.exe` bugchecks the machine. Never remove entries.
- **A failed powercfg query must never look like an empty list.** "Nothing is keeping you awake" and
  "I couldn't check" are different states; `Status.Error` carries the second.
- **`powercfg` never reports a PID**, only an image path. Anything that needs to identify *which*
  instance holds a lock is guesswork; `hostsOf()` returns every candidate owner rather than picking.
- **Never match or kill on a shared runtime's name.** `msedgewebview2.exe` is several unrelated apps
  at once (including nightcap's own window). Matching goes through `Request.targets()`, which
  substitutes the resolved owners; `killByExe` refuses `genericHosts` outright. Bypassing either
  means closing every WebView2 app on the machine.
- **Parent links must be validated with creation times** (`validParent`). Windows recycles PIDs, so
  an unvalidated PPID can name an unrelated process and misattribute a wake lock.
- **Driver and service requests have no `Exe`.** They're displayed but unkillable, and `decide()`
  skips them.
- **Autostart must stay a scheduled task.** An `HKCU\...\Run` key cannot start an elevated app and
  fails silently at login.

## Frontend

**Go marshals nil slices as JSON `null`, not `[]`.** The frontend calls `.filter()`/`.map()` on
these fields directly, so a nil slice throws inside render and leaves a blank window. Every array
crossing the boundary goes through `normalize()` in `watcher.go` (Status) or `sanitize()` in
`config.go` (Config). If you add a slice field to a boundary type, add it to one of those and to
`json_test.go`. This is the bug that blanked the UI once already.

**The UI is the imported design system, and `App.tsx` is the only place that talks to Go.**
`src/design/` holds the tokens (`styles.css`, pulled in by `src/style.css`), the primitives in
`components/`, and the app's four views plus the countdown overlay in `kit/`. Those views are
presentational: no state, no bindings, data and callbacks in from `App.tsx`. Boundary types live in
`src/types.ts` and the shared formatters in `src/format.ts` — `wailsjs/models.ts` has never been
generated here, so the bound methods' return types are useless and every call site casts. Read
`src/design/README.md` before changing anything visual; it is the rulebook the components follow.

Wails injects `window.go` *after* the page starts executing, and the generated bindings dereference
it eagerly — so calling a bound method too early throws a **synchronous** TypeError, not a rejected
promise. Thrown from an effect that unmounts the React tree and leaves a blank window until a manual
reload. Everything goes through `whenReady()` and `call()` in `src/bridge.ts`; never call a binding
directly from a component.

## Conventions

- Snooze durations cross the boundary as minutes: `0` un-snoozes, negative means indefinitely.
- Exe names are matched as lowercased basenames everywhere. Run anything user-supplied through
  `normalizeExe()`.
- Config is sanitised on every load and save (`sanitize()`), so a hand-edited file can't produce a
  zero timeout that kills everything instantly. That is also where kill history gets trimmed to
  `historyLimit`, so nothing else needs to bound it.
- Kill history lives in `Config.History`, newest first, and rides along with `GetConfig()`. Only
  successful kills are recorded — a failed kill is not a kill.
- Prefer fixing a rule in `decide()` over adding a special case at a call site.
