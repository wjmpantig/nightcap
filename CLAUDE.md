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
- **Anything that must react to a config change hooks `store.watch()`, not the caller.** `update()`
  in `config.go` is the only way the config ever changes, so the tray follows the paused state from
  there and sees it however it was set — window switch, settings view, tray menu. Adding a second
  notifier at a call site means the next call site forgets. The hook fires outside the lock (so it
  cannot deadlock a write by reading the config back) and with the *sanitised* config.
- **Tray art is never scaled.** `build/windows/tray-{active,inactive}.ico` are packed from the brand
  pack's hand-drawn per-size PNGs by `make-tray-ico.py`; at 16–24px a 1px gap opens between the disc
  and the horizon that a downscaled 48px image loses. Re-run that script if the art changes.
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

### Component structure

Every component and view is a folder. No exceptions in `src/design/`:

```
[Component]/
  [Component].tsx           the component, default-exported nothing — named export only
  index.ts                  re-export barrel: export { X } from './X'; export type { XProps } from './X'
  [Component].module.scss   its styles
  [Component].test.tsx      only if there is logic worth pinning
```

Import a component by its folder (`from "@/design/components/core/Button"`), never by the inner file.

**`@/` means `frontend/src/`.** Anything outside the current directory is imported through the alias;
only same-directory siblings (`./Button.module.scss`) stay relative, so no import ever starts with
`../`. The alias is declared twice and the two have to agree — `paths` in `tsconfig.json` for types,
`resolve.alias` in `vite.config.ts` for the build.

Shared helpers live in `src/utils/`. `cx()` is the className merge (a thin wrap around `clsx`, so the
dependency is named in one file); boundary types are `src/types.ts` and formatters `src/format.ts`.

**No inline styles.** No `style={{...}}` and no injected `const CSS` string with a
`document.createElement('style')` — several components were written that way and none are now. Styles
go in the sibling `.module.scss` and come in as `styles.foo`. Two exceptions, both about values that
only exist at runtime: a CSS custom property being *set* from a prop (`style={{ "--ring-frac": … }}`)
and an SVG geometry attribute. Everything else is a class.

**Sizes are authored in px and emitted relative.** `rem()` and `em()` in
`src/design/styles/_units.scss` convert at build time, so the source keeps the design rulebook's
vocabulary (13px body, 44px rows, 216px sidebar) while the browser gets units that follow the user's
font size. `@use "@/design/styles/units" as *;` at the top of any stylesheet that needs them.

Wrap layout and type lengths in `rem()`. Use `em()` for a *measure* — a `max-width` on a run of text
is a character count, so it scales with that text's own size. Four things stay in raw px, on purpose:
a 1px hairline border (one device pixel; in rem it lands on a fraction and blurs), shadow offsets and
blurs (optical, not layout), the 2px inset "you are here" bar, and the 2px slide in the fade keyframe.

`src/style.scss` and `src/design/tokens/*.scss` stay global (not modules) — they define the custom
properties and the `[data-theme="light"]` swap, which have to be global to cascade. `App.tsx` is the
one component that is not a folder: it is the entry `main.tsx` imports. It still has an
`App.module.scss`.

## Conventions

- **Micro commits.** One reviewable idea per commit, each one building and passing its tests on its
  own. A mechanical rename and the behaviour change riding along with it are two commits. Say *why*
  in the body, not what the diff already shows.
- **Keep this file true.** Any structural change — a new directory convention, a moved boundary, a
  renamed layer, a new build step, a dependency that changes how things are wired — updates CLAUDE.md
  in the same commit that makes it. A convention documented here and not followed in the code is
  worse than no convention. If it is unclear whether something belongs in this file, ask rather than
  guessing.
- Snooze durations cross the boundary as minutes: `0` un-snoozes, negative means indefinitely.
- Exe names are matched as lowercased basenames everywhere. Run anything user-supplied through
  `normalizeExe()`.
- Config is sanitised on every load and save (`sanitize()`), so a hand-edited file can't produce a
  zero timeout that kills everything instantly. That is also where kill history gets trimmed to
  `historyLimit`, so nothing else needs to bound it.
- Kill history lives in `Config.History`, newest first, and rides along with `GetConfig()`. Only
  successful kills are recorded — a failed kill is not a kill.
- Prefer fixing a rule in `decide()` over adding a special case at a call site.
