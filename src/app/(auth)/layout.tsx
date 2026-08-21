import type { ReactNode } from "react";

/**
 * Auth shell.
 *
 * Deliberately bare. It used to centre its child in a `max-w-sm` column and render a
 * small Vyral mark above it, which suited a single card and nothing else — the sign-in
 * screen is a full-bleed two-column composition with the glass wordmark as its own
 * headline, and both of those fought it. That chrome moved into `sign-up`, which is the
 * page that still wants it.
 *
 * `min-h-dvh` rather than `min-h-screen`: on mobile the browser chrome makes `100vh`
 * taller than the visible viewport, which would put a centred layout slightly off.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="flex min-h-dvh flex-1 flex-col">{children}</main>;
}
