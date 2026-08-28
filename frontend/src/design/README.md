# nightcap — design system

Imported from the claude.ai/design project `nightcap Design System`, and now what the app actually
renders: `src/App.tsx` is the shell over `kit/`, and `src/style.css` pulls in `styles.css` below.
The old `src/App.css` palette it replaced is gone.

nightcap is a Windows desktop utility. Some apps take a power request (`powercfg /requests`) and
forget to let go, so the PC never sleeps. nightcap shows you who is doing it, lets you put the repeat
offenders on a watchlist, and force-closes them once the machine has genuinely been idle long enough.

It is a **single-product, single-surface design system**: one always-running tray app with one window
and one tray menu. There is no marketing site, no docs site, no mobile app. Everything here is sized
for that: dense, near-black, keyboard- and mouse-driven desktop chrome that has to be trustworthy
enough to terminate your processes at 3am.

**Deliberate departure:** the brief asked for a proposed direction, *not* a copy of the UI nightcap
was shipping. That direction has since replaced it — the old `src/App.css` palette (`#11131a` slate,
Nunito, no brand colour) and its single-column table layout are gone. `kit/README.md` has a
row-by-row table of what changed and why. The brand asset pack (`assets-2b/`) **is** ground truth and
is followed exactly.

---

## Content fundamentals

nightcap's voice is a **calm systems engineer who admits what it doesn't know**. The existing README
and UI copy are unusually good at this, and the system keeps that voice.

**Person.** Second person for the user's things, third person for the machine's. "You've been idle
for 22m", "nightcap cannot close those". Never first-person plural — there is no "we", it's one
program on your PC.

**Casing.** Sentence case everywhere. Section labels are the *only* uppercase, and only through CSS
(`--tracking-label`, 0.08em) — never typed in caps. The product name is always lower-case
**nightcap**: not Nightcap, not NIGHTCAP, mid-sentence included.

**Sentences, not labels.** Empty states and warnings are full sentences with a full stop:
- "Nothing is holding a wake lock right now."
- "Nothing watched yet. Add an app from the list above."
- "Some wake locks are held by drivers or services. nightcap cannot close those."

Buttons and pills are fragments with no full stop: "Watch", "Un-snooze", "Snooze…", "Remove",
"keeping awake", "snoozed 3h 40m".

**Say the consequence.** The product kills processes; copy never softens that. "Termination is a hard
`TerminateProcess`. Unsaved work in a watched app is lost." Prefer the specific verb — *close*,
*terminate*, *snooze*, *watch* — over "manage", "optimise", "handle".

**Admit uncertainty out loud.** This is the house style, straight from the codebase: "powercfg names
wake-lock holders by image path and never by PID"; "when several apps embed the same runtime nightcap
cannot tell which one holds the lock, and says so by listing every owner". If the UI is guessing, the
UI says it is guessing (see `ProcessName`'s "shared runtime, owned by …").

**Explain the mechanism in one clause.** Settings hints give the reason, not the restatement:
"Registers a scheduled task with highest privileges — a Run key cannot launch an elevated app."

**Numbers and units.** Durations are always `Xm SSs` (`22m 04s`) in mono, never "22 minutes".
Timeouts are `min`, warnings are `sec`, lower-case, next to the field. Executables always keep their
`.exe`. Paths are mono and never abbreviated in a tooltip.

**No exclamation marks. No emoji. No jokes about sleep.** The one permitted piece of warmth is the
brand's own metaphor — the setting moon, and the tagline "Let this PC sleep". An empty list in
nightcap is good news and the copy may say so plainly ("This PC will sleep on its own schedule.")
but it never celebrates.

**Ellipses** are used the OS way — a control that opens a further choice gets one: "Snooze…".

---

## Visual foundations

**The idea.** A window you open at night, glance at, and close. Near-black so it doesn't burn a hole
in a dark room; one cool accent for "nightcap is looking after this", one warm accent for "something
is awake". Nothing decorative. It should look like it belongs beside Task Manager, not beside a
consumer app.

**Colour.** Five base values come from the asset pack and are not negotiable: night `#0a0c10`, tile
`#0f1420`, moonlight `#7fb3ff`, amber `#ffc27f`, paper `#e8eaee`. Everything else is derived from
them in `oklch` (`tokens/colors.css`). On light backgrounds the pack's pair is used instead:
`#2f6fd0` / `#b8791f`.

Colour carries **meaning, one hue per state**, and is never used for decoration:

| Token | Meaning |
| --- | --- |
| `--state-awake` (amber) | this is holding a wake lock right now |
| `--state-watched` (moonlight) | on the watchlist, armed |
| `--state-closed` (ember `#ff8b7a`) | terminated by nightcap |
| `--state-snoozed` (grey) | intentionally quiet |
| `--state-locked` (dim slate) | a driver or service — nothing to close |

Ember is the only invented hue (the pack has no destructive colour); it is a warm coral chosen to sit
between amber and red so the palette stays a single warm/cool pair rather than gaining a third
temperature. **Never a saturated pure red** — a red-alert UI would be dishonest about an app that
closes VLC.

**Type.** Three families, `tokens/typography.css`:
- **Space Grotesk** Medium, `-0.035em` — the wordmark and every heading. It comes from the lockup art,
  so the app's headings are literally set in the logo's typeface.
- **IBM Plex Sans** — UI body at **13px**, small at 12px, labels at 11px/600/0.08em uppercase.
  Desktop-utility density: 13px is body, not 16px.
- **IBM Plex Mono** — every executable name, path, duration, countdown and config value. If a string
  came from the operating system, it is mono. This is the system's strongest typographic rule.

**Spacing and layout.** 4px grid with a 6px half-step for control padding (`tokens/spacing.css`).
The window is a fixed 1000×640 shell: a 38px custom titlebar, a 216px sidebar on
`--surface-sunken`, and one scrolling content column with 24px padding. List rows are 44px — dense
but still a comfortable click target. Panels are 16px-padded, or unpadded when they hold rows.
The sidebar's bottom block (mark state, armed count, idle meter, pause switch) is fixed to the
bottom: the app's status is never scrolled out of view.

**Backgrounds.** Flat colour only. **No images, no gradients, no illustrations, no textures, no
patterns, no photography.** The brand has no imagery library and should not acquire one — a utility
that owns a corner of your taskbar has no business shipping hero art. The single permitted "image"
is the mark itself. Overlays are the exception: the countdown dialog dims the window with
`--surface-overlay` plus a 6px backdrop blur, and that is the only blur in the product.

**Elevation.** Depth comes from a **1px lighter top edge** (`--shadow-edge-top`, `inset 0 1px 0` at
6% paper), not from drop shadows. Panels: hairline `--line` border, `--radius-md` (10px),
`--shadow-panel` (a barely-there 0 1px 2px). Only two things cast a real shadow: the window itself
and the countdown dialog (`--shadow-overlay`). The panel that is actively counting down gets
`--glow-moon` — a moonlight ring, not a bigger shadow.

**Corners.** Tight and consistent: 3px on checkboxes, **5px on every control**, 10px on panels, 14px
on the window, full pill on badges. The 22% squircle is reserved for the app icon and never appears
inside the UI.

**Borders.** Hairline 1px, `--line` (`#1e2431`) for separators and `--line-strong` (`#2a3242`) for
anything interactive. Rows are separated by a single hairline with **no zebra striping and no outer
border on the first row**. Nothing in nightcap has a coloured left-border accent — the selected nav
item's 2px inset moonlight bar is the one exception, and it means "you are here".

**Interaction states.**
- *Hover* — a 6% paper wash (`--surface-hover`) and the border warms to `--line-accent`. Text
  buttons lift from `--text-secondary` to `--text-primary`. Never a colour change on the fill except
  on the primary button, which lightens toward paper.
- *Press* — the surface goes **darker** (`--surface-sunken`), never a scale transform. Nothing in
  this product bounces or shrinks.
- *Focus* — a 2px `--focus-ring` (moonlight at 32%) box-shadow, keyboard only (`:focus-visible`).
- *Disabled* — 40% opacity, no colour change.
- *Selected* — `--surface-selected` (moonlight 8%) plus the 2px inset bar.

**Motion.** Fades and 2px slides. 140ms for hover/press/focus, 200ms for a view or banner appearing,
`cubic-bezier(.2,.8,.25,1)`. **No bounce, no spring, no pulse, no attention-seeking animation** — the
one thing that must never look playful is a 30-second countdown. Progress bars and the countdown ring
are strictly `linear` at exactly 1s per tick. The idle meter turning amber past 75% is the only
element in the product that changes colour on its own. `prefers-reduced-motion` kills all of it.

**Transparency.** Used for washes and rings only (`--moonlight-a08/16/32`, `--paper-a06/12`), never
for panels or text. Blur appears exactly once, behind the countdown dialog.

**Light theme.** `[data-theme="light"]` exists for documentation, print, and the Windows light-tray
context. It is not the app's primary mode and the accent swaps to the pack's darker pair.

---

## Iconography

**Brand marks (real assets, never redrawn).** `assets-2b/` at the repo root holds the 2b pack: the
currentColor master `nightcap-mark.svg`, the `-accent` / `-duotone` / `-outline` variants,
`state-active` / `state-inactive`, the pixel-snapped tray art at 16/20/24/32 (each hand-tuned per
size, **never scaled** — at 16–24px a 1px gap opens between disc and horizon), the squircle app
icons, and `lockup-horizontal.svg`, plus the rasterised PNGs and the three Windows `.ico` files. The
geometry is parametric and frozen: a disc 0.76S across, occluded by a fully-rounded horizon bar
0.94S × 0.095S crossing 74% of the way down. The `Mark` component reproduces exactly those numbers —
do not invent variants.

Tray rules from the pack, kept: swap white/black art on `SystemUsesLightTheme` /
`WM_SETTINGCHANGE` (Windows does not tint tray icons); inactive is the same art at 75% opacity plus
the sunk-moon geometry; minimum 16px in the tray, 20px anywhere else; clear space = 0.25 × mark
height.

**UI icons — substitution, flagged.** The codebase ships **no icon set at all** (the shipped UI uses
plain text buttons). So the system standardises on **Lucide** (24px grid, 2px stroke, rounded caps)
from CDN — its stroke weight and squared-off geometry sit comfortably next to the mark's flat shapes,
and it is close to Windows' own Fluent line style without pretending to be it. **This was the design
system's choice, not the brand's: swap it if you have a preference.**

Lucide is loaded through one component, `Icon`, and nowhere else. `Icon` injects the Lucide UMD
script once, reads the icon geometry out of `window.lucide`, and renders a **real inline `<svg>`
stroked in `currentColor`** — so an icon inside a danger button turns ember for free. Consequences:
icons are never hand-drawn, never PNG, never a CSS-mask image, and never coloured directly. 14px in
dense rows, 16px default, 20px in headers. **The glyph source lives in exactly one file — swap `SRC`
in `Icon.tsx` and the whole system changes icon set.** Like the fonts, this is a CDN dependency:
nightcap is an offline desktop app, so vendoring Lucide locally and pointing `Icon` at it is a real
outstanding task.

The working vocabulary: `zap` (holding a lock), `eye` / `eye-off` (watch), `alarm-clock` (snooze),
`power` (closed by nightcap), `lock` (driver/service), `pause` / `play`, `settings`, `shield-check`
(elevated), `triangle-alert` / `shield-alert`, `clock`, `refresh-cw`, `trash-2`, `plus`, `x`,
`git-fork` (shared runtime), `folder-open`, `log-out`.

**Emoji and unicode-as-icon: never.** Not in the UI, not in copy, not in status strings. The one
non-alphanumeric character with a job is the ellipsis in "Snooze…". Status is communicated by a 5px
`Badge` dot plus a word, never by a coloured emoji circle.

---

## Fonts — substitution, flagged

The repo ships only `nunito-v16-latin-regular.woff2`, and the shipped UI is set in Nunito — a rounded
humanist face that reads friendlier than this product behaves. The lockup art specifies **Space
Grotesk Medium at -0.035em**, so that is the display face here, paired with **IBM Plex Sans/Mono**
for UI and machine data.

All three load from **Google Fonts** via `tokens/fonts.css` — no binaries are shipped. **nightcap
must render offline, so self-hosting these three as woff2 with real `@font-face` rules is an
outstanding task.** Space Grotesk in particular should be outlined in any exported lockup art, per
the asset pack's own note.

---

## Index

| Path | What it is |
| --- | --- |
| `styles.css` | The single entry point consumers link. `@import` list only. |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius-shadow.css`, `motion.css`, `theme-light.css`, `base.css` |
| `components/` | The React primitives — see below |
| `kit/` | The nightcap window — the **live** app views that `src/App.tsx` renders, + `kit.css` + its own README |

Not imported from the design project: the 15 `guidelines/*.card.html` foundation specimens, the
`.prompt.md` per-component usage docs, `templates/app-window/`, the `_ds_*` preview harness, and the
`assets/` copies (the repo already has `assets-2b/`). They live at
`claude.ai/design/p/1bd256d4-25dd-4bcb-83be-214840e03650`.

### Components

Because the codebase defines no component library, this is an authored set sized to nightcap's actual
surfaces — every one of them appears in the desktop UI kit.

**`components/brand/`** — `Mark`, `Lockup`
**`components/core/`** — `Icon`, `Button`, `IconButton`, `Badge`, `Panel`, `SectionHeader`, `Banner`,
`EmptyState`
**`components/forms/`** — `TextInput`, `NumberField`, `Select`, `Checkbox`, `Switch`
**`components/data/`** — `ProcessName`, `ListRow`, `CountdownRing`, `IdleMeter`

Each is a `.tsx` exporting its component and an exported `…Props` interface. Import them
**without the extension** (`from './design/components/core/Button'`).

**Intentional additions** (not in any source, added because the product needs them):
- `Icon` — a wrapper for the substituted Lucide set, so the glyph source is swappable in one file.
- `ProcessName`, `CountdownRing`, `IdleMeter` — nightcap's three domain-specific displays. The
  shipped UI expresses all three as bare text; they carry too much meaning to stay unstyled.

**Deliberately absent:** Toast (a background utility that pops things over your work is the behaviour
nightcap exists to stop — messages are inline `Banner`s), Modal-as-a-primitive (the countdown overlay
is the only modal and lives in the UI kit), Tabs, Avatar, Tooltip (native `title` is correct on a
desktop app), Dropdown menu (the native `Select` is correct).
