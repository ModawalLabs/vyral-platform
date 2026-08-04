<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Vyral Platform — agent guide

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui.
Read `README.md` for the full structure; this file covers what to do and avoid.

## Commands

```bash
npm run dev        # dev server
npm run check      # typecheck + lint + format:check + unit tests (run before committing)
npm run test:e2e   # Playwright — needs `npx playwright install chromium webkit` once
```

`typedRoutes` generates route types during `next build`. After adding or moving
a page, `npm run typecheck` fails against the stale map until you run
`npm run build` once — the errors are misleading, the fix is a build.

## Rules

- **Server components by default.** `"use client"` goes on the smallest leaf that
  needs interactivity, never on a layout or page that could stay on the server.
- **Never touch `process.env`.** Declare it in `src/env.ts`, import `env`. ESLint
  blocks the alternative.
- **Never hand-edit `src/components/ui/`.** Those are shadcn CLI output and get
  overwritten by `npx shadcn@latest add`. Compose around them; project-specific
  components live in `src/components/`.
- **Paths come from `src/config/routes.ts`.** `typedRoutes` is on, so string
  literals in `<Link href>` are a build error.
- **Route handlers** wrap in `handler()` and return `ok()` from `@/lib/api`;
  signal failure by throwing the helpers in `@/lib/errors`. Don't build
  `NextResponse.json` error shapes by hand.
- **Logging** goes through `@/lib/logger`, not `console.*` (ESLint warns).
- **Pages read through `src/data/*`,** never `fetch` inline. Those modules
  import `server-only` and return types from `src/types/*`; hooking up an API
  means editing one file, not the components. See the README's Data access
  section.
- **Tests query the accessible tree** (`getByRole`, `getByLabelText`), not test
  ids or class names.
- **Never hard-code a colour.** Every surface resolves through a CSS variable in
  `src/app/globals.css`. A new colour means a new token in `:root`, overridden
  in `.dark`. The exception is a token used only on a surface that does not
  change with the theme — `--brand-ink`, `--brand-on-media`,
  `--warning-on-media`, `--danger-on-media` are `:root`-only for that reason and
  must stay that way. See the Theming section of the README.

## Gotchas

- Base UI (what shadcn v4 builds on) stamps `role="button"` on any non-native
  element passed to `render`. For a link that looks like a button, use
  `ButtonLink` — it applies `buttonVariants` to a real `<a>`.
- The Edge proxy lives in `src/proxy.ts` (Next 16 renamed `middleware`). It runs
  on every page view: no database calls, no heavy imports.
- Adding a page means choosing a route group — `(app)` for anything inside the
  workspace, `(auth)` for signed-out flows. Each already owns its chrome. A page
  in neither (like `new/`) gets the root layout only, which is how `/new` is
  full-bleed with no sidebar.
- Escape is bound to dismissing `/new`. Anything else that binds Escape must
  check `event.defaultPrevented` first, or closing a popup will also close the
  screen under it.
- `src/lib/grouping.ts`, `src/lib/pagination.ts` and `src/types/pagination.ts`
  currently have **no consumer** — they outlived a removed Chats page and are
  kept for the next list that needs paging or date headers. Reach for them
  before writing either from scratch; don't assume they are wired to anything.
  Logic of that shape belongs there, pure and unit-tested, not inline in a
  component.
- `next/font` must publish Geist as `--font-sans`, because that is the name
  `globals.css` maps Tailwind's `font-sans` to. Rename it and the whole app
  silently falls back to the browser serif.
- Frosted surfaces need something coloured behind them or they read as flat
  outlined boxes. Both the hero and the card rails place their own blurred
  brand wash for exactly that reason — don't delete it as decoration.
- Home-page card rails share `SectionRail`. Add a row by rendering fixed-width
  `snap-start` children into it, not by hand-rolling another scroller.
- Auth and the database are deliberately not chosen yet. Don't invent one; the
  hook points are listed at the bottom of `README.md`.
