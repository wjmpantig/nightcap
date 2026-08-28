# nightcap — mark 2b (Moonset) asset pack

Parametric geometry: in a square of side S the moon is a disc 0.76S across, occluded by a horizon
bar (0.94S x 0.095S, fully rounded) that crosses it 74% of the way down. Every size is pixel-snapped;
at 16-24px a 1px gap is opened between disc and bar so both shapes still read (optical correction —
at 32px and up the bar overlaps the disc properly).

## SVG (source of truth)
- `svg/nightcap-mark.svg` — currentColor master, 100x100 viewBox.
- `svg/nightcap-mark-accent.svg` · `-duotone.svg` (amber horizon) · `-outline.svg` (hollow moon).
- `svg/state-active.svg` · `svg/state-inactive.svg` (moon sunk to a sliver).
- `svg/tray-16|20|24|32.svg` + `-outline` + `-inactive` — pixel-snapped per size, not scaled.
- `svg/appicon-win-256.svg` · `svg/appicon-macos-512.svg` (squircle, 22% radius).
- `svg/lockup-horizontal.svg` — mark + wordmark, Space Grotesk Medium at -0.035em tracking.
  Outline the text before shipping anywhere the font is not loaded.

## Windows
- `ico/nightcap.ico` — app icon, PNG entries 16/20/24/32/48/64/128/256 on the #0f1420 tile.
- `ico/nightcap-tray-white.ico` (dark taskbar) · `nightcap-tray-black.ico` (light taskbar).
  Swap on `SystemUsesLightTheme` / `WM_SETTINGCHANGE` — Windows does not tint tray icons.
- `png/tray-white-inactive-*.png` — inactive state at 75% opacity.

## macOS (later)
`png/appicon-macos-1024.png` for the .icns set; ship the tray SVGs as template images so the
menu bar tints them.

## Colours
night `#0a0c10` · tile `#0f1420` · moonlight `#7fb3ff` · amber `#ffc27f` · paper `#e8eaee`.
On light backgrounds use `#2f6fd0` and `#b8791f`.

## Clear space & minimum size
Clear space = 0.25 x mark height. Minimum 16px in the tray, 20px anywhere else.
