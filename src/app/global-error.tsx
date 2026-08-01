"use client";

/**
 * Last-resort boundary: replaces the root layout when it is the thing that
 * failed, so it must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Application error</h1>
        <p style={{ opacity: 0.7, fontSize: "0.875rem" }}>
          The app failed to load{error.digest ? ` (ref: ${error.digest})` : ""}.
        </p>
        <button
          onClick={reset}
          style={{
            border: "1px solid currentColor",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            cursor: "pointer",
            background: "transparent",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
