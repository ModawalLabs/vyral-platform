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
│   ├── (marketing)/        Public pages — header + footer chrome
│   ├── (auth)/             Sign-in / sign-up — centered card chrome
│   ├── (dashboard)/        Authenticated product — sidebar chrome
│   ├── api/                Route handlers (health check lives here)
│   ├── layout.tsx          Root layout: fonts, metadata, providers
│   ├── error.tsx           Client error boundary
│   ├── global-error.tsx    Boundary for failures in the root layout itself
│   ├── not-found.tsx       404
│   ├── robots.ts           Generated /robots.txt
│   └── sitemap.ts          Generated /sitemap.xml
├── components/
│   ├── ui/                 shadcn/ui primitives — regenerate, don't hand-edit
│   ├── layout/             Header, footer, container
│   └── providers.tsx       All client providers, mounted once
├── config/
│   ├── routes.ts           Route table + protected prefixes
│   └── site.ts             Name, description, URLs, social links
├── hooks/                  Reusable client hooks
├── lib/
│   ├── api.ts              Route-handler helpers (`ok`, `fail`, `handler`)
│   ├── errors.ts           `AppError` taxonomy → HTTP status mapping
│   ├── logger.ts           Structured logging (JSON in production)
│   └── utils.ts            `cn`, formatters, small helpers
├── env.ts                  Validated environment variables
├── instrumentation.ts      APM/tracing init + server error reporting
└── proxy.ts                Edge proxy (Next 16's middleware): request IDs, auth gate
```

Route groups (`(marketing)`, `(auth)`, `(dashboard)`) share a URL namespace but
each own their chrome, so adding a page means picking a group — never rebuilding
a layout.

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

| Concern        | Where it plugs in                                     |
| -------------- | ----------------------------------------------------- |
| Auth           | `src/proxy.ts` (session gate), `src/app/(auth)/`      |
| Database       | `src/lib/db.ts` (new), `DATABASE_URL` in `src/env.ts` |
| Error tracking | `src/instrumentation.ts`, `src/app/error.tsx`         |
| Rate limiting  | `src/proxy.ts` or per-handler in `src/lib/api.ts`     |
| CSP            | `src/proxy.ts` — needs a per-request nonce            |
