import type { ComponentProps } from "react";

/**
 * Google's and Facebook's own marks, full colour.
 *
 * Deliberately the opposite call to the social glyphs on the Settings page, which are
 * lucide-style strokes so they sit with every other icon in the app. A sign-in button
 * is the one place where the logo has to be the real one: both providers' brand
 * guidelines specify these marks for OAuth buttons, and a stylised approximation on a
 * "Continue with Google" button reads as a phishing page rather than as house style.
 *
 * `aria-hidden` on both — the button's own label already names the provider, so the
 * mark would only make a screen reader say it twice.
 */
export function GoogleMark(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function FacebookMark(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      {/* Drawn in `currentColor` so the caller picks: a white knockout on a blue button,
          or the brand blue on a white one. The sign-in row uses the latter — both
          providers sit on the same white surface, so the mark is the only thing telling
          them apart and it has to be the real colour. */}
      <path
        fill="currentColor"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.5 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}
