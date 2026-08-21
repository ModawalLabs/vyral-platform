import type { ComponentProps } from "react";

import type { SocialProvider } from "@/types/social";

/**
 * The three publishing destinations, as glyphs.
 *
 * Drawn in lucide's language — 24 viewBox, 2px round stroke, `currentColor` — rather
 * than dropped in as the official filled marks. Every other icon in the app is a
 * lucide stroke glyph, and one row of filled logos beside them reads as pasted-in
 * assets. Each provider's name is printed next to its glyph, so the glyph supports
 * the label rather than carrying the identification on its own.
 *
 * TODO: swap in the official marks if brand guidelines ever require them.
 */
function Youtube(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m10 15 5-3-5-3z" fill="currentColor" />
    </svg>
  );
}

function Instagram(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

/**
 * An eighth note with the mark's characteristic hook — as close as this stroke
 * vocabulary gets to TikTok's logo without tracing it.
 */
function Tiktok(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M13 16a4 4 0 1 1-4-4" />
      <path d="M13 16V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

/**
 * What each provider is called, what linking it buys you, and the chip it sits in.
 *
 * The chip colours are the providers' own, held at low alpha so three saturated
 * brands in one column read as a set rather than as competing badges. Literal values
 * rather than tokens on purpose: a brand's red is its red in both themes, and routing
 * it through the palette would make it drift with the theme. Only the foreground
 * flips, because the same red that clears contrast on white does not on near-black.
 */
export const PROVIDER_META: Record<
  SocialProvider,
  {
    name: string;
    blurb: string;
    Mark: typeof Youtube;
    /** The mark's plate: tinted background plus a foreground that clears it. */
    chip: string;
    /**
     * A blurred corner bloom on the tile, so each one carries its own light.
     *
     * Half the alpha of the chip's tint on purpose. The bloom covers a quarter of the
     * tile, so what reads as a hint at chip size reads as a coloured panel at this
     * one — it has to sit under the text rather than compete with it.
     */
    glow: string;
  }
> = {
  youtube: {
    name: "YouTube",
    blurb: "Publish finished cuts straight to your channel.",
    Mark: Youtube,
    chip: "bg-[#ff0000]/10 text-[#c81e1e] dark:text-[#ff6a6a]",
    glow: "bg-[#ff0000]/12",
  },
  instagram: {
    name: "Instagram",
    blurb: "Post Reels without leaving the workspace.",
    Mark: Instagram,
    chip: "bg-[#e1306c]/10 text-[#b91c56] dark:text-[#f782ac]",
    glow: "bg-[#e1306c]/12",
  },
  tiktok: {
    name: "TikTok",
    blurb: "Send vertical cuts to your account.",
    Mark: Tiktok,
    chip: "bg-[#00f2ea]/12 text-[#0a7d78] dark:text-[#5ee7e1]",
    glow: "bg-[#00f2ea]/12",
  },
};
