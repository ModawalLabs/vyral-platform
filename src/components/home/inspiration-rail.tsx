"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { useComposer } from "@/components/home/composer-provider";
import { SectionRail } from "@/components/home/section-rail";

/** Mock content — swap for a curated feed once the library exists. */
const INSPIRATION = [
  {
    src: "/assets/inspiration/cosmic-journey.webp",
    alt: "A figure silhouetted against a swirling cosmic nebula",
    label: "Sci-fi",
    prompt:
      "A lone astronaut drifting through a violet nebula, slow rotation, volumetric light",
  },
  {
    src: "/assets/inspiration/music-video.webp",
    alt: "A performer lit by coloured stage lights",
    label: "Music",
    prompt:
      "Stage performance under strobing colour gels, handheld camera, shallow depth of field",
  },
  {
    src: "/assets/inspiration/product-launch.webp",
    alt: "A product rotating on a lit studio pedestal",
    label: "Product",
    prompt:
      "Hero product rotating on a matte pedestal, seamless backdrop, crisp rim lighting",
  },
  {
    src: "/assets/inspiration/social-ad.webp",
    alt: "A fast-cut lifestyle scene framed for social",
    label: "Social",
    prompt:
      "Punchy 9:16 lifestyle cutdown, quick whip pans, bold on-screen type, daylight",
  },
  {
    src: "/assets/inspiration/wedding-film.webp",
    alt: "A couple in soft natural light at golden hour",
    label: "Wedding",
    prompt:
      "Golden hour couple portrait in an open field, drifting slider move, warm halation",
  },
] as const;

export function InspirationRail() {
  const { applyPrompt } = useComposer();

  return (
    <SectionRail
      title="Get inspired for your next video"
      description="Start from a look that already works, then make it yours."
    >
      {INSPIRATION.map((item, index) => (
        <article
          key={item.src}
          className="group relative aspect-[2/3] w-[232px] shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-border/60 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-20px_color-mix(in_oklab,var(--brand)_60%,transparent)]"
        >
          <Image
            src={item.src}
            alt={item.alt}
            fill
            // Fixed-width cards, so the rendered size never changes with the
            // viewport — one candidate plus a 2x retina step is all that's used.
            sizes="232px"
            // Only the first two are plausibly above the fold on a laptop.
            priority={index < 2}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />

          {/* Scrim: opaque enough at the base for small type to stay legible in
              both themes, since the artwork behind it is arbitrary. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"
          />

          <span className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            {item.label}
          </span>

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-3.5">
            <p className="line-clamp-3 text-[12.5px] leading-snug text-white/90">
              {item.prompt}
            </p>
            {/* Text CTA, no plate. `--brand-on-media` rather than `--brand`:
                the scrim behind it is dark in both themes, so the label has to
                be a lightened violet to stay both legible and recognisably
                purple. */}
            <button
              type="button"
              onClick={() => applyPrompt(item.prompt)}
              className="inline-flex items-center gap-1 self-start rounded text-xs font-semibold text-brand-on-media transition-colors hover:brightness-115 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              Try now
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>
        </article>
      ))}
    </SectionRail>
  );
}
