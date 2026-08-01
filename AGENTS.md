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
npm run test:e2e   # Playwright
```

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
- **Tests query the accessible tree** (`getByRole`, `getByLabelText`), not test
  ids or class names.

## Gotchas

- Base UI (what shadcn v4 builds on) stamps `role="button"` on any non-native
  element passed to `render`. For a link that looks like a button, use
  `ButtonLink` — it applies `buttonVariants` to a real `<a>`.
- The Edge proxy lives in `src/proxy.ts` (Next 16 renamed `middleware`). It runs
  on every page view: no database calls, no heavy imports.
- Adding a page means choosing a route group — `(marketing)`, `(auth)`, or
  `(dashboard)` — each already owns its chrome.
- Auth and the database are deliberately not chosen yet. Don't invent one; the
  hook points are listed at the bottom of `README.md`.
