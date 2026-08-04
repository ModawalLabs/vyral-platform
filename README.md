# Vyral Platform

Production foundation for the Vyral SaaS. Next.js 16 (App Router) · React 19 ·
TypeScript (strict) · Tailwind CSS v4 · shadcn/ui.

No database or auth provider is wired up yet — those decisions are deliberately
deferred. Everything else a product needs on day one is in place.

## Getting started

```bash
npm install
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Before the first `npm run test:e2e`, install the browser Playwright drives.
It is a separate download from `npm install`, and the only setup step that is
not covered by it:

```bash
npx playwright install chromium webkit
```

Both, not just chromium: `playwright.config.ts` defines a `mobile-safari`
project (iPhone 14), and it is WebKit that drives it. With chromium alone the
whole suite exits 1 on 19 launch failures. To skip the mobile pass deliberately,
run `npx playwright test --project=chromium` rather than leaving WebKit
uninstalled.

## Scripts

| Command                 | What it does                                 |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Dev server (Turbopack)                       |
| `npm run build`         | Production build (standalone output)         |
| `npm run start`         | Serve the production build                   |
| `npm run typecheck`     | `tsc --noEmit`                               |
| `npm run lint`          | ESLint                                       |
| `npm run format`        | Prettier write                               |
| `npm run test`          | Vitest unit tests                            |
| `npm run test:coverage` | Vitest with v8 coverage                      |
| `npm run test:e2e`      | Playwright end-to-end                        |
| `npm run analyze`       | Build with the bundle analyzer               |
| `npm run check`         | Everything CI runs — use before opening a PR |

## Project structure

```
src/
├── app/
│   ├── (app)/              Workspace — collapsible sidebar chrome
│   │   ├── page.tsx        Home: hero over two card rails
│   │   ├── projects/ templates/ settings/
│   │   └── layout.tsx      Reads the sidebar cookie, renders the shell
│   ├── (auth)/             Sign-in / sign-up — centered card chrome
│   ├── new/                Full-screen composer — no group, so no sidebar
│   ├── api/                Route handlers (health check lives here)
│   ├── layout.tsx          Root layout: fonts, metadata, providers
│   ├── loading.tsx         Route-level skeleton
│   ├── error.tsx           Client error boundary
│   ├── global-error.tsx    Boundary for failures in the root layout itself
│   ├── not-found.tsx       404
│   ├── robots.ts           Generated /robots.txt
│   └── sitemap.ts          Generated /sitemap.xml
├── components/
│   ├── ui/                 shadcn/ui primitives — regenerate, don't hand-edit
│   ├── layout/             Sidebar shell, sidebar, theme switch, page frames
│   ├── home/               Hero, composer, doodle field, card rails
│   ├── projects/           Project card, grid section, toolbar
│   ├── templates/          Template card, mixed-orientation grid, pagination
│   ├── create/             Chrome for the full-screen /new route
│   └── providers.tsx       All client providers, mounted once
├── config/
│   ├── routes.ts           Route table + protected prefixes
│   ├── site.ts             Name, description, URLs, social links
│   └── ui.ts               Sidebar widths + collapse-cookie contract
├── data/                   Data access — swap mocks for the API here
│   ├── projects.ts
│   └── templates.ts
├── types/                  Shared domain contracts
│   ├── project.ts
│   ├── pagination.ts       `Page<T>` envelope — used by Templates
│   └── template.ts         Template library card contract
├── hooks/                  Reusable client hooks
├── lib/
│   ├── api.ts              Route-handler helpers (`ok`, `fail`, `handler`)
│   ├── errors.ts           `AppError` taxonomy → HTTP status mapping
│   ├── logger.ts           Structured logging (JSON in production)
│   ├── grouping.ts         Date bucketing — unused, see below
│   ├── pagination.ts       Page ranges + `?page=` clamping
│   └── utils.ts            `cn`, formatters, small helpers
├── env.ts                  Validated environment variables
├── instrumentation.ts      APM/tracing init + server error reporting
└── proxy.ts                Edge proxy (Next 16's middleware): request IDs, auth gate
```

Route groups (`(app)`, `(auth)`) share a URL namespace but each own their chrome,
so adding a page means picking a group — never rebuilding a layout. `new/` is
deliberately in neither: it renders under the root layout only, which is what
makes it edge-to-edge with no sidebar.

## Theming

Light and dark are driven by `next-themes`, which writes a `dark` class on
`<html>`; every color in the app resolves through a CSS variable in
`src/app/globals.css`. **Never hard-code a color** — a new surface means a new
token, defined in `:root` and overridden in `.dark`.

Beyond the shadcn palette the app adds:

| Token                       | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| `--brand`, `--brand-accent` | The violet→purple ramp (CTA gradient, glows)    |
| `--brand-foreground`        | Text/icons on a filled brand surface            |
| `--brand-ink` †             | Brand violet darkened for text on a white chip  |
| `--brand-text`              | Brand violet for small text on an app surface   |
| `--brand-on-media` †        | Brand violet lightened for text on a dark scrim |
| `--warning-on-media` †      | "Processing" label on a card scrim              |
| `--danger-on-media` †       | "Failed" label on a card scrim                  |
| `--glass`, `--glass-border` | Frosted plate + its bevel                       |
| `--glass-sheen`             | Specular highlight along a glass top edge       |
| `--glass-text-*`            | Fill and bevel for the glass wordmark           |
| `--glass-iris-*`            | Chromatic fringing at the wordmark's edges      |
| `--glass-shine-*`           | The specular band that sweeps across it         |
| `--composer`                | Raised panel inside the glass frame             |
| `--doodle-opacity`          | Strength of the film-kit field behind the hero  |
| `--brief-texture-opacity`   | Strength of the theatre photo behind the brief  |

**† These four are defined in `:root` only, on purpose — do not "fix" them by
adding a `.dark` override.** Each sits on a surface that does not change with
the theme: `--brand-ink` is only ever used on a near-white chip, and the other
three on the dark scrim over card artwork, which is dark in both modes. Making
them theme-reactive would push each below AA contrast in exactly the mode where
it matters. Every one carries a comment saying so at its definition.

`--brand-text` is the ordinary case and _is_ overridden in `.dark`: it carries
brand-coloured 11px labels (the version-history toggle) on the app's own card
and panel surfaces, which do flip with the theme. It exists separately from
`--brand` because `--brand` measures 4.0:1 as text on the dark card — fine for a
button fill at 3:1, short of the 4.5:1 small text needs. `--brand-text` measures
7.0:1 dark and 7.4:1 light.

### The brief card texture

A theatre photograph sits behind the brief card at `--brief-texture-opacity`, masked
away before the prose so nothing sits under small text.

**Two things vary by theme, not one.** Opacity is the obvious half; the blend mode is
the half that makes it work. Dark uses `screen`, which keeps only what is lighter than
the card, so the spotlight and the gilt glow through and the photograph's near-black
background contributes nothing — straight alpha would lay a grey film over everything
instead. Light uses `multiply`, keeping only what is darker, so the beam reads as a
faint warm shadow; `screen` on a white card is invisible.

Both opacities were set by **measurement**: render the card with and without the layer
and diff the pixels. Light 0.07 shifts a mean 5.6/255 and dark 0.10 shifts 6.0/255, so
the two themes land at the same subtlety. A first pass by eye had dark at 0.16 — twice
as strong as light. Raise them together or that balance goes.

The `-z-10` layer needs `isolate` on the card: inside a stacking context a negative
z-index paints above the context's own background but below its in-flow content, which
is the sandwich wanted here. Without it the layer slides behind the card entirely and
disappears.

### Two traps in `.glass-frame`

Both were live for a long time and both are silent.

- **Never hand-write `-webkit-backdrop-filter` beside the standard property.**
  Lightning CSS treated the pair as one declaration and emitted _only_ the prefixed
  form, so `backdrop-filter` computed to `none` on every glass surface in the app —
  the frosted blur did nothing at all, in any browser that wants the unprefixed
  property. Prefixing is the build's job.
- **`.glass-frame` sits in `@layer components`, so any Tailwind background or border
  utility on the same element beats it.** A pill carrying both `.glass-frame` and
  `bg-foreground/[0.03]` is not glass; it is the flat tint, silently. Where an element
  already has utilities, reach for `bg-glass border-glass-border backdrop-blur-2xl`
  instead — tailwind-merge then replaces them cleanly and the cascade has nothing to
  argue about. `SessionSettingsBar` does exactly this.

`GlassWordmark` fakes liquid glass deliberately: no browser can clip
`backdrop-filter` to glyphs, so it stacks two copies of the word — a translucent
frosted body with chromatic fringing at the edges, and a specular band that
sweeps across every 8s and then rests. It needs something colored behind it or
the translucent fill has nothing to refract; the home page supplies two blurred
orbs. The sweep is disabled under `prefers-reduced-motion`.

The sidebar's collapsed state is stored in a cookie, not localStorage, so the
server renders the correct width on first paint instead of snapping shut after
hydration. `src/config/ui.ts` owns that contract.

## Workspace home

The home page is a hero (glass wordmark + composer) over two card rails. The
composer's draft lives in `ComposerProvider`, so a Trending Prompt card or a
"Try now" button loads its text into the input and focuses it — the page itself
stays a server component; only the provider and the rails are client.

`SectionRail` is the shared rail: heading, arrow controls, snap scrolling, and
edge fades driven by scroll position rather than always-on, so the first card is
never dimmed when nothing is hidden behind it.

Card copy in `trending-prompts.tsx` and `inspiration-rail.tsx` is mock content,
colocated so it is obvious what to delete once real data exists. The portrait
stills in `public/assets/inspiration/` came from the landing project.

The greeting types itself in on mount. `Typewriter` reserves the finished line's
box with an `invisible` copy so nothing below shifts while characters land, hands
assistive tech the whole line up front via an `sr-only` copy, and does nothing at
all under `prefers-reduced-motion`.

That reserved cell is `w-fit mx-auto` — **the width of the line, not of the
container** — and it matters. The reveal is left-aligned while typing, because
centring a growing string nudges every character already on screen half a glyph
sideways per keystroke. Left-aligned in a container-width cell, though, the line
starts at the page margin and snaps to the middle on the last keystroke. That was
invisible on the home page, whose column is about as wide as the line, and a ~520px
jump on `/new`, where the same greeting spans the viewport.

The regression test lives on `/new` for that reason, and measures the **first
character** with a `Range` rather than the element's box — the box spans its grid cell
and never moved even when the text jumped half the screen.

`DoodleField` is the film-kit pattern behind the hero — one SVG `<pattern>`, so
it tiles at any size for no network cost. Its tile is wider than it is tall
because the hero is short: a square tile would put a third of the drawings below
the section's own fold, where they would never render.

## Full-screen composer (`/new`)

Both **New Video** buttons — sidebar and Projects toolbar — link to `/new`, which
renders the same `ComposerHero` at full viewport height with no sidebar. It is a
route rather than an overlay because the screens that follow Generate will each
need their own URL, and because back, refresh and share keep working.

`ComposerHero` is shared with the home page; only height and padding differ, so
the two surfaces cannot drift.

Escape dismisses the screen — but `DismissCreate` checks `event.defaultPrevented`
first, because the composer's own menus close on Escape too. Without that guard,
closing a model dropdown would throw you off the whole screen. Closing returns
you to wherever you opened it from, falling back to home when there is no history
(a shared link, a fresh tab).

### Production Workspace

Two tabs: **Production Workspace** and **Asset Library**. The right column carries no
heading of its own — the first tab names it, and a heading above it said the same
thing twice.

`Production Workspace` is one scrolling page, not a set of destinations:

| Region         | What                                                    |
| -------------- | ------------------------------------------------------- |
| Revision rail  | Horizontal filmstrip of revisions — see below           |
| Brief card     | "Brief" + Edit, a row of setting pills, then the story  |
| Screenplay     | One tab per beat, then `Generate Scenes` below the card |
| Test Screening | Hidden until `Generate Scenes` is clicked — see below   |

Type scale carries the nesting: the workspace tabs (16px) and the `Brief`,
`Screenplay` and `Test Screening` headings (18px) are the top level; the beat tabs
sit inside a section and stay at 14px. Edit sits immediately after the `Brief`
heading rather than across the card from it, so the label and the control that
unlocks it read as one thing.

The two generate buttons are deliberately different weights: `Generate Scenes` is
`BrandOutlineButton` (2px edge, not a hairline — these run full width, and a 1px
border stretched across a column reads as a divider), while
`Generate Final Production` stays filled. Two identical filled buttons on one page
would have left neither looking like the last word.

The brief card is **two rows, not two columns.** The settings are a single row of
glass pills — model, platform, aspect ratio, duration, resolution — directly above
the prose, because they are the constraints it answers. They stay on screen showing
the applied values and are **disabled until Edit is pressed** rather than swapped for
read-only text, so nothing moves when an edit starts.

`SessionSettingsBar` is now the **only** bar of pills in the app, so `PILL`, `PANEL`
and `Chevron` live in it rather than beside the settings data. `resolution` is
session-only, so a handed-over session takes `DEFAULT_RESOLUTION` rather than carrying
one in the URL.

### The composer is a field and a button

Both composers — home and the `/new` launcher — are down to the prompt field and one
submit. The model / duration / aspect pills and the attachment button are gone from
both: the Production Workspace owns every setting, and offering them in the composer
as well meant two places to change the same thing with only one of them feeding
anything downstream.

Consequences worth knowing:

- `PromptComposer` no longer holds settings state. `initialSettings` is submitted
  as-is, so a home handoff carries `DEFAULT_SETTINGS` — `/new` still reads its opening
  settings from those params rather than from its own defaults, so the handoff has to
  keep carrying them.
- `components/home/composer-settings.tsx` is now data and helpers only, no components.
- `DismissCreate`'s `event.defaultPrevented` guard still matters, but for the
  workspace's popups (the brief's pills, the model hover card) rather than the
  composer's, which no longer has any.

The model's trade-offs live behind an info affordance (`ui/hover-card.tsx`, Base
UI `PreviewCard`) rather than a permanent card that took a third of the page to
say something you only need while choosing. The trigger is a real `button`, since
`PreviewCard` opens on focus as well as hover and that is the only way the content
is reachable without a mouse.

The aspect-ratio mismatch warning and the screenplay's duration-vs-target bar have
both been removed.

### Beats are tabs, not accordions

`ScreenplayTab` is a nested tab set: one tab per beat, one scene on screen. A scene
carries eight fields and its media, and the interesting comparison is between takes
of the same beat rather than between beats, so stacking five of them open was mostly
scrolling.

A scene panel is **read-only**: take switcher and beat-stepping arrows on top, then
the script in two columns, then its media across the full width below.

The two script columns are one `<dl>` laid out with `grid-flow-col` over four rows,
not two hand-cut halves — the flow fills column one downwards before starting column
two, so Duration→Lighting and Action→Transition fall out of the field order itself
and cannot drift from it. The threshold is an arbitrary `@min-[40rem]` rather than the
`@2xl` step: on a 1180px window this panel's content box is 651px, which missed 42rem
by 21px and stacked, while 40rem still leaves each value column ~210px.

Every beat ships with **two takes**, take 2 derived through `regenerateScene` so it
stays in step with the seeds instead of being hand-written.

Generating scenes is a section-level action (`Generate Scenes`, beside the heading);
the per-scene Edit, Regenerate, Duplicate and Delete controls are gone.

Three consequences worth knowing:

- **Panels are `keepMounted`.** Without it, starting an edit and glancing at another
  beat discards the draft silently.
- **Reordering is gone.** The collapsed accordion row carried the drag handle. It was
  briefly replaced by move controls, and those arrows now **step between beats**
  instead — a faster way through the tab row than aiming at each tab, and they name
  their destination (`Next scene: Problem`). Nothing calls `moveScene` any more, and
  `@dnd-kit/core`, `/sortable` and `/utilities` are no longer imported anywhere.
- **The active tab is resolved, not stored.** Deleting the open scene would leave
  `value` pointing at a tab that no longer exists; `ScreenplayTab` falls back to the
  first track during render rather than syncing state in an effect.

### Test Screening

**Revealed by `Generate Scenes`, not present from the start.** An assembled-cut player
and a row of takes standing by with no takes to show reads as broken, so the section is
absent rather than empty.

The flag lives in the session (`scenesGenerated`) rather than in the brief tab:
`TabsContent` unmounts its panel on a tab switch, so a local flag would be lost the
moment you glanced at the Asset Library and came back.

The assembled cut, then the takes it was assembled from: a full-width preview, a
centred row of one card per scene, and a full-width `Generate Final Production`.

The scene row **centres when it fits and scrolls when it does not**, via `mx-auto` on a
`w-max` inner row inside an `overflow-x-auto` wrapper. `justify-center` is the trap
there: once the content overflows a scroll container it pushes the overflow past the
left edge, where it cannot be scrolled back to. `flex-wrap` was the other option and
looked worse — at this card size five of them break 4+1 on a 1180px window.
Presentational for now — the selected take is local state, because there is no
assembly behind it. When one exists that moves into the session, beside the scene
tracks it is choosing between.

Two things here are load-bearing:

- **`ASPECT_CLASS`** (`components/create/aspect.ts`) is shared with the screenplay's
  media tiles. Two copies of the ratio map would eventually disagree.
- The preview card is **`flex`, not `grid`.** The frame inside sizes itself from
  `h-full`, and a percentage height only resolves against a definite container. A
  grid row is auto-sized even when the grid has a fixed height, so under `grid` the
  height came out indefinite, the aspect ratio ran the other way — width first — and
  a portrait frame measured 365px tall inside a 224px box.

The per-scene take control is a `‹ v1/3 ›` stepper rather than the `VersionList`
dropdown used elsewhere: that opens a full-width list of previews, which cannot fit a
112px card. Its buttons are named by beat ("Next take of Problem") because five
identical "next" buttons on one row are indistinguishable to anything reading them.

Because the screenplay shares a page with the brief, "Edit", "Regenerate" and
"N versions" now appear more than once on it. Tests scope to
`[data-slot=brief-card]` or `[data-slot=scene-panel]` accordingly, and an unscoped
`getByRole("tab")` picks up the beats as well as the workspace tabs.

### Revisions are snapshots of the whole brief

`StoryVersion` carries its `settings` alongside its `text`, and
`settings` is **derived** from the active revision rather than stored beside it:

```ts
const settings = activeStory.settings; // session-provider.tsx
```

A 30-second landscape YouTube cut and a 10-second vertical Reel are not the same
film with different knobs, so prose and settings version together. One Edit button
governs both halves and one Save lands them as a single revision — which also
means activating an older revision restores its settings for free, with no second
copy that could drift out of step.

Consequence worth knowing: switching revision changes the aspect ratio and model,
which reshapes every scene's frame. The director posts a chat line saying so.

Revisions are picked from `RevisionRail` — a horizontally scrolling filmstrip,
oldest first, each new one appended to the right. Each card shows its settings
(`Kling · 16:8 · 10s`) as well as its prose, because a revision that changed only
its settings has prose identical to its parent and would otherwise look like a
duplicate.

`aspectWarning` in `lib/session/models.ts` is now unused for the same reason the
warning is gone from the page; see Unused utilities.

The strip renders from **revision 1**, where `VersionList` hides itself below two
entries. That is not an inconsistency: the strip is the only thing on the brief
marking which revision is active, so it has to be present before there is anything
to switch between. There is deliberately no "Revision N" label above it.

Two details in there are deliberate:

- The active card is brought into view by setting `scrollLeft` on the rail, **not**
  by `scrollIntoView` — that walks up the ancestor chain and would scroll the
  workspace column and the glass panel behind it for what is a change inside one
  row. (Same family of bug as the `block: "nearest"` fix in the composer.)
- The rail carries `py-1 -my-1`. `overflow-x` clips vertically at the padding
  edge, so without the padding every card's focus ring is shaved off top and
  bottom.

Scene cards keep the compact `VersionList` dropdown instead: a card already
carries eight fields and a clip slot, and its take history is an aside rather than
the point of it.

## AVIF is production-only, on purpose

`next.config.ts` drops AVIF from `images.formats` in development. The dev
optimiser **hangs indefinitely** on an AVIF request: with the browser's
`Accept: image/avif,image/webp,…` the response never arrives, while the same URL
under `Accept: image/webp` answers in ~13ms. Every `next/image` in the app renders
blank under `npm run dev` without this — request sent, `complete: false`,
`naturalWidth: 0`, no error anywhere. `next start` on the same build encodes AVIF in
~80ms, so production output is unchanged.

Worth knowing when judging images locally: `toBeVisible()` passes on an image that
never decoded, so a Playwright assertion is not evidence that a picture painted.
Check `complete` and `naturalWidth`.

## Unreachable on purpose

`session-provider.tsx` exposes several callbacks that currently have no caller.
They are kept rather than deleted, and each block carries a comment saying so.

**The render engine** — `startRender`, `retryScene`, `runScene`, the queue pump, plus
`lib/session/render.ts` and `RenderJob`. Orphaned when the Generation tab was
removed.

**The asset slice** — `assets`, `generateAsset`, `uploadAsset`, `reuseAsset`, plus
`initialAssets`, `coverageByBeat` and `missingAssetCount` in `lib/session/assets.ts`.
The Asset Library's UI was removed to be rebuilt from scratch and was their only
caller; `AssetsTab` is now an empty component kept as the place to build in.
`placeholderFor` in the same module is still live — the scene panel's media tiles use
it. Rebuilding means calling these, not re-deriving them: `generateAsset` already
resolves after a delay with one slot rigged to fail the first time, and `uploadAsset`
takes a real `File` through an object URL.

**Scene mutation** — `updateScene`, `duplicateScene`, `deleteScene`,
`regenerateOneScene` and `moveScene`. The first four were orphaned when the per-scene
Edit, Duplicate, Delete and Regenerate controls were removed; `moveScene` when the
arrow buttons became beat navigation rather than reordering. `regenerateOneScene`
carries the "one scene changes, the others are returned by reference" guarantee,
which is worth more than the lines it costs. `activateSceneVersion` is still live.

Why keep either: the render engine is the most intricate logic in the app — a
two-at-a-time queue, non-linear progress, a rigged failure and a per-scene retry —
and a video product will need a render surface again. Wiring a new one means calling
`startRender`, not rebuilding it.

But **both lost their end-to-end coverage with the UI that drove them**, so they are
only as correct as the last time they ran. `nextProgress` and the scene helpers in
`lib/session/*` still have unit tests; the provider wiring around them does not. If
either is genuinely not coming back, delete the section and its supporting module
together rather than leaving half of it.

## Unused utilities

Three modules have no consumer right now. `src/lib/grouping.ts` was written for a
Chats page that has since been removed; `nextStoryVariant` was orphaned when
Regenerate was folded away, and `aspectWarning` when the mismatch warning was dropped
from the brief. All are kept because they are pure, fully tested, and the obvious
answer the next time the need comes back.
**Delete them if that never happens; do not assume they are wired to something.**

| Module                                           | What it does                                                                                                                                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/grouping.ts`                            | `groupByRecency` — buckets records into Today / Yesterday / Previous 7 days / … on **calendar days, not elapsed hours**, so something from 11pm last night reads as "Yesterday" at 1am. Injectable `now`. |
| `nextStoryVariant` in `src/lib/session/story.ts` | Picks a canned story variant that is not the one showing. `STORY_VARIANTS` itself is still live — it seeds revision 1.                                                                                    |
| `aspectWarning` in `src/lib/session/models.ts`   | Flags a vertical platform paired with a landscape ratio. `deriveRationale` and `profileFor` beside it are live — the model hover card uses both.                                                          |

Their unit tests still run, so they cannot rot silently.

`src/lib/pagination.ts` and `src/types/pagination.ts` **are now wired up** — the
Templates page uses `resolvePage`, `getPageRange` and `Page<T>`. They spent a while on
this list; they were written for the case that did not exist yet, and it turned up.

## Templates

Search, a grid of 15 cards per page (5 landscape, 10 portrait), then pagination. The
whole page stays a server component: pagination is real `?page=` links, so the URL is
the state and it survives a reload, a shared link and no-JS.

Clamping lives in `src/data/templates.ts`, not the page — it is the only side that
knows the total, and `Page.page` is defined as what was actually served. `?page=99`
serves the last page and `?page=abc` serves the first, rather than an empty grid.

The grid mixes two orientations over **square tracks**: landscape spans two columns
and one row, portrait one column and two rows. Two details are easy to get wrong:

- **The row height must equal the column width, and `calc((100% - gap)/cols)` does not
  do it.** A percentage in `grid-auto-rows` resolves against the container's _height_,
  so it silently degrades to `auto` — and an auto row sizes to content, which these
  cards have none of, collapsing them to the height of their caption. `cqw` is a
  width-derived length and legal there, which is why the grid sits inside an
  `@container`: container units resolve against an _ancestor_, never the element's own
  box.
- **It does not tile flush.** 2×1 and 1×2 tiles at this mix cannot, so
  `grid-flow-row-dense` reduces the holes rather than removing them. The column count
  caps at four for that reason — measured, six columns left a conspicuous void
  mid-grid.

The mock data builds orientations from a repeating `["16:8", "8:16", "8:16"]` cycle
rather than listing 45 ratios by hand, so **every** page comes out 5 landscape and 10
portrait, including any page added later.

The search field is the same stateless shell the Projects toolbar uses — see
`SearchField` for what wiring it up involves.

## Data access

Pages read through `src/data/*`, never `fetch` inline. Each module exports
async functions over a type in `src/types/*`, so hooking up the API means
replacing one file's bodies while every page and component stays put:

```ts
// src/data/projects.ts — today
export async function listProjects(): Promise<Project[]> {
  return [...MOCK_PROJECTS].sort(byNewestFirst);
}
// …later, same signature
export async function listProjects(): Promise<Project[]> {
  const res = await fetch(`${env.API_URL}/projects`, { next: { revalidate: 30 } });
  return (await res.json()) as Project[];
}
```

These modules import `server-only`, so a client component that reaches for one
fails the build instead of shipping the mock — or, later, a credential — to the
browser. Components render the contract, including its gaps: a `Project` with no
`thumbnailUrl` draws the placeholder tile, so real posters appear with no code
change the moment the API returns them.

Independent reads go through `Promise.all` so they overlap rather than
waterfall — cheap with mocks, load-bearing once they are network calls.

For a paginated endpoint, return the `Page<T>` envelope in
`src/types/pagination.ts` rather than a bare array — it carries the slice plus
enough context to draw controls without a second request.

## Conventions

**Server components by default.** Add `"use client"` only at the leaf that needs
interactivity, and keep data fetching above it. Every `"use client"` boundary
ships JavaScript to every user.

**Never read `process.env` directly.** Declare the variable in `src/env.ts` and
import `env`. ESLint enforces this — a missing variable then fails the build
instead of a production request.

**Route handlers return `ok()` / throw `AppError`.** Wrap handlers in `handler()`
from `@/lib/api` so thrown errors become well-formed JSON with the right status
and internals never reach the client.

**Routes live in `src/config/routes.ts`.** `typedRoutes` is on, so a typo in a
`<Link href>` is a build error rather than a 404 in production.

**UI primitives come from the shadcn CLI** (`npx shadcn@latest add <name>`).
Treat `src/components/ui/` as generated: compose around it, and put project-
specific components elsewhere. `ButtonLink` shows the pattern — it exists
because Base UI's Button would strip link semantics from an anchor.

## Testing

- **Unit** (`*.test.ts[x]` beside the source) — Vitest + Testing Library, jsdom.
- **End-to-end** (`e2e/*.spec.ts`) — Playwright, boots a real server.

Test behavior through the accessible tree (`getByRole`), not implementation
details. The e2e suite fails on the kind of a11y regression a snapshot wouldn't
catch.

## Deployment

`output: "standalone"` is set, so the app runs anywhere Node does.

```bash
docker build --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com -t vyral .
docker run -p 3000:3000 --env-file .env.production vyral
```

`NEXT_PUBLIC_*` variables are inlined at build time — they must be build args,
not runtime env. Server-only secrets stay runtime.

`GET /api/health` is the liveness probe; extend it with dependency checks as a
database, cache, and queue are added.

## Decisions still open

Auth, database/ORM, background jobs, payments, rate limiting, and error tracking
are intentionally unchosen. The hook points exist:

| Concern        | Where it plugs in                                                   |
| -------------- | ------------------------------------------------------------------- |
| Auth           | `src/proxy.ts` (session gate), `src/app/(auth)/`                    |
| Current user   | `CURRENT_USER` in `src/components/home/composer-hero.tsx`           |
| Database       | `src/lib/db.ts` (new), `DATABASE_URL` in `src/env.ts`               |
| Generation API | `submit()` in `prompt-composer.tsx` — has the prompt and `settings` |
| Feed data      | Mock arrays in `trending-prompts.tsx` / `inspiration-rail.tsx`      |
| Library data   | `src/data/projects.ts`                                              |
| Error tracking | `src/instrumentation.ts`, `src/app/error.tsx`                       |
| Rate limiting  | `src/proxy.ts` or per-handler in `src/lib/api.ts`                   |
| CSP            | `src/proxy.ts` — needs a per-request nonce                          |

### Inert on purpose

These are styled shells, not bugs — each is commented where it lives:

- The search field on Projects renders and focuses but does not filter.
- **Log out** in the sidebar footer — a button, not a link, because signing out
  clears a session rather than navigating. Handler goes in `app-sidebar.tsx`.
- **New folder** on Projects has no handler.
- Project card hover actions — Edit, Preview, Download — have no handler; they
  already receive the `project`, so wiring them needs only the call.
- **Generate** validates and disables correctly but goes nowhere yet.
