# site

The nightcap website: one page, built from the app's own design system and published to
<https://wjmpantig.github.io/nightcap/> by `.github/workflows/pages.yml`.

```sh
npm install
npm run dev      # http://127.0.0.1:5173/nightcap/
npm run build    # dist/
```

## It shares source with the app, it does not copy it

`@` resolves to `../frontend/src`, in both `vite.config.ts` and `tsconfig.json`. `Lockup`, `Badge`,
`Button`, `Panel`, `ListRow` and `ProcessName` on this page are the components the desktop app
ships, and the colours, type and spacing come from `frontend/src/design/tokens/`. Change a token and
both move. Never fork a component into `site/` — fix it in the design system.

The three things that make the sharing work, all in `vite.config.ts`:

- the `@` alias, which Vite also applies to the `@use "@/design/styles/units"` at the top of every
  shared `.module.scss`;
- `server.fs.allow`, because `frontend/src` is outside this Vite root;
- `resolve.dedupe` for react/react-dom, or a bare import inside `frontend/src` can resolve to
  `frontend/node_modules` and give the page two Reacts.

`base` is `/nightcap/` because Pages serves this as a project site, so anything in `public/` is
referenced relatively, never with a leading slash.

## Where the design came from, and where the copy diverges

The layout is `templates/marketing-site/MarketingSite.dc.html` in the Claude Design project
["nightcap Design System"](https://claude.ai/design/p/1bd256d4-25dd-4bcb-83be-214840e03650). Its
structure, rhythm and voice are kept. Its copy is not, in the places where it claimed things
nightcap does not do:

| The template said | Why it is not here |
| --- | --- |
| "18% CPU", "saved ~9%", "Battery, in minutes" | nightcap measures neither CPU nor battery. The feature card is the shared-runtime story instead. |
| "no network calls" | It checks GitHub once a day for a newer release. The page says so. |
| "8 MB · macOS 13+ · Windows 11" | Unverified, so dropped. |
| "If a paid tier arrives it will be for teams" | No such plan, and the repo carries no licence file to point at. |
| "Will it close something I am using? No." | It is a hard terminate and unsaved work is lost. The page says that too. |

Two further departures from `frontend/src/design/README.md`, both deliberate and both confined to
this folder: the page uses one radial gradient behind the hero (the app window is flat colour by
rule; this is the marketing surface), and it does **not** use the template's 9-second float on the
app mock — "no attention-seeking animation" outranks it.

The app mock is not a screenshot. It is `ListRow` + `Badge` + `ProcessName` with fixed data, so it
cannot drift away from what the app actually renders.
