"use client";

import { ArrowUpRight, TrendingUp } from "lucide-react";

import { useComposer } from "@/components/home/composer-provider";
import { SectionRail } from "@/components/home/section-rail";

/** Mock content — replace with a trending query once generation data exists. */
const TRENDING = [
  {
    category: "Cinematic",
    runs: "12.4k",
    prompt:
      "A neon-lit Tokyo alley in the rain, camera tracking a lone cyclist through reflected signage",
  },
  {
    category: "Product",
    runs: "9.1k",
    prompt:
      "Slow-motion macro of espresso pouring into a glass cup, morning light raking across the counter",
  },
  {
    category: "Aerial",
    runs: "7.8k",
    prompt:
      "Drone sweep over Icelandic black sand dunes at golden hour, long shadows, no horizon in frame",
  },
  {
    category: "Retro",
    runs: "6.2k",
    prompt:
      "1990s VHS home video of a backyard birthday party, warm grain, light leaks, handheld drift",
  },
  {
    category: "Abstract",
    runs: "5.5k",
    prompt:
      "A paper crane unfolding into a flock of birds against a seamless studio backdrop, soft key light",
  },
] as const;

export function TrendingPrompts() {
  const { applyPrompt } = useComposer();

  return (
    <SectionRail
      title="Trending Prompts"
      description="What the community is generating right now."
    >
      {TRENDING.map((item) => (
        <button
          key={item.prompt}
          type="button"
          onClick={() => applyPrompt(item.prompt)}
          // The resting shadow is tuned to disappear on a dark page and give the
          // card lift on a light one, where a white-on-white plate would
          // otherwise read as a flat outline.
          className="glass-frame group relative w-[264px] shrink-0 snap-start overflow-hidden rounded-2xl p-4 text-left shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--brand)_45%,transparent)] hover:shadow-[0_18px_40px_-16px_color-mix(in_oklab,var(--brand)_55%,transparent)] focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          {/* Specular bevel along the top edge — the tell that sells glass. */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glass-sheen to-transparent"
          />
          {/* Brand light pooling in from the corner, warmed on hover. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-8 size-32 rounded-full bg-brand/15 blur-2xl transition-colors duration-300 group-hover:bg-brand/30"
          />

          <span className="relative flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-foreground/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <TrendingUp className="size-3" />
              {item.category}
            </span>
            <span className="text-[11px] text-muted-foreground/80 tabular-nums">
              {item.runs} runs
            </span>
          </span>

          <span className="relative mt-3 line-clamp-3 block text-[13px] leading-relaxed text-foreground/90">
            {item.prompt}
          </span>

          <span className="relative mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-brand">
            Use this prompt
            <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </button>
      ))}
    </SectionRail>
  );
}
