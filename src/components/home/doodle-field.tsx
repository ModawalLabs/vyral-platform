/**
 * Tiling field of hand-drawn film-kit doodles, ported from the landing site so
 * the two products share a visual signature.
 *
 * An SVG `<pattern>` rather than an image: it tiles seamlessly at any viewport
 * size, stays crisp on any display, costs no network request, and the whole
 * field is tuned with a single opacity value.
 *
 * Strokes are `currentColor`, so `text-foreground` on the root is what makes
 * one drawing work in both themes — dark ink on the light page, light ink on
 * the dark one. The opacity itself is a token, because the same alpha does not
 * read the same way in both directions.
 *
 * Single instance per page: the `<defs>` ids are static, and a second copy
 * would duplicate them.
 *
 * The tile is deliberately wider than it is tall. It sits behind the hero,
 * which is only ~500px on a laptop — a square tile would push a third of the
 * drawings below the fold of its own pattern, where they would never render and
 * the same four icons would repeat across the width forever.
 */
export function DoodleField({
  tileWidth = 760,
  tileHeight = 440,
  fadeBottom = true,
}: {
  tileWidth?: number;
  tileHeight?: number;
  /**
   * Dissolve the field before the container's bottom edge. Wanted where the
   * section abuts another one, unwanted where it fills the viewport — there it
   * just leaves the lower half bare.
   */
  fadeBottom?: boolean;
}) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 size-full text-foreground"
      style={{
        opacity: "var(--doodle-opacity)",
        // `overflow-hidden` on the container would otherwise slice whichever
        // tile row straddles its bottom edge, leaving a line of half-drawn
        // icons. Fading out above that edge dissolves the field instead of
        // cutting it, at any viewport height.
        maskImage: fadeBottom
          ? "linear-gradient(to bottom, black 45%, transparent 88%)"
          : undefined,
      }}
    >
      <defs>
        {/* --- the doodles --- */}
        <g
          id="dd-clapper"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="20" width="40" height="24" rx="3" />
          <path d="M4 20l3-10 38-4-3 10z" />
          <path d="M15 9.4l-2.4 8M25 8l-2.4 8M35 6.6l-2.4 8" />
        </g>

        <g
          id="dd-reel"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="24" cy="24" r="19" />
          <circle cx="24" cy="24" r="3.5" />
          <circle cx="24" cy="11" r="4.5" />
          <circle cx="24" cy="37" r="4.5" />
          <circle cx="11" cy="24" r="4.5" />
          <circle cx="37" cy="24" r="4.5" />
        </g>

        <g
          id="dd-camera"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="19" width="27" height="19" rx="3" />
          <path d="M32 24.5l11-6.5v20l-11-6.5z" />
          <circle cx="14" cy="12" r="6" />
          <circle cx="26" cy="12" r="6" />
        </g>

        <g
          id="dd-light"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 6h15l4 15H13z" />
          <path d="M24.5 21v13" />
          <path d="M14 44l10.5-10L35 44" />
          <path d="M11 9L4 5M10 15l-7 1" />
        </g>

        <g
          id="dd-mic"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="18" y="5" width="12" height="21" rx="6" />
          <path d="M11 21a13 13 0 0 0 26 0" />
          <path d="M24 34v8M18 43h12" />
        </g>

        <g
          id="dd-filmstrip"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="13" width="40" height="22" rx="2" />
          <path d="M4 19h40M4 29h40" />
          <path d="M10 15.5v1M18 15.5v1M26 15.5v1M34 15.5v1" />
          <path d="M10 31.5v1M18 31.5v1M26 31.5v1M34 31.5v1" />
        </g>

        {/* --- the tile --- */}
        <pattern
          id="dd-pattern"
          width={tileWidth}
          height={tileHeight}
          patternUnits="userSpaceOnUse"
        >
          {/* Two loose rows rather than a grid, with the offsets and rotations
              jittered: an even grid gives the repeat away the moment the eye
              catches two of the same icon. Every drawing sits inside the tile's
              height so all six actually appear behind the hero. */}
          <use href="#dd-clapper" transform="translate(64 62) rotate(-13) scale(1.1)" />
          <use href="#dd-reel" transform="translate(322 40) rotate(9)" />
          <use href="#dd-camera" transform="translate(566 74) rotate(-6) scale(1.15)" />
          <use href="#dd-light" transform="translate(176 244) rotate(12)" />
          <use href="#dd-mic" transform="translate(428 268) rotate(7)" />
          <use
            href="#dd-filmstrip"
            transform="translate(648 238) rotate(-9) scale(1.05)"
          />
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#dd-pattern)" />
    </svg>
  );
}
