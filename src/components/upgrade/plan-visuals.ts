import {
  Briefcase,
  Building2,
  Globe,
  Rocket,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { PlanTone } from "@/types/pricing";

/**
 * What each tier looks like.
 *
 * The gradient frames and accents are the landing site's, kept as literal colours
 * rather than routed through the app's palette. A tier's colour is its identity — the
 * Creator plan is the blue one on the marketing site and has to be the blue one here,
 * or the two pages stop describing the same product. This is the same exception the
 * social provider marks take, and for the same reason.
 *
 * Only the *text* accent flips with the theme. The landing site is dark-only, so its
 * accents were tuned for a dark card (`blue-400` and friends); at that lightness they
 * fail against a white one, so light mode gets the darker step. The frames are large
 * blocks of colour and read correctly on both.
 */
export const PLAN_VISUALS: Record<
  PlanTone,
  { Icon: LucideIcon; frame: string; accent: string; badge: string }
> = {
  creator: {
    Icon: User,
    frame: "from-[#60a5fa] to-[#4f46e5]",
    accent: "text-[#2563eb] dark:text-[#7cb3fb]",
    badge: "bg-[#60a5fa]/12 text-[#2563eb] dark:text-[#7cb3fb]",
  },
  pro: {
    Icon: Users,
    frame: "from-[#f472b6] to-[#c026d3]",
    accent: "text-[#be1e70] dark:text-[#f9a2cd]",
    badge: "bg-[#f472b6]/12 text-[#be1e70] dark:text-[#f9a2cd]",
  },
  studio: {
    Icon: Briefcase,
    frame: "from-[#fbbf24] to-[#f97316]",
    accent: "text-[#a35a06] dark:text-[#fcc95a]",
    badge: "bg-[#fbbf24]/14 text-[#a35a06] dark:text-[#fcc95a]",
  },
};

/**
 * The credit packs' ladder, cool to warm so it reads left to right as it gets bigger.
 *
 * Keyed by pack id rather than position: the landing site's frames are tied to a
 * specific pack, and an index would silently reassign them all if a pack were inserted.
 */
export const PACK_VISUALS: Record<
  string,
  { Icon: LucideIcon; frame: string; accent: string }
> = {
  starter: {
    Icon: Sparkles,
    frame: "from-[#a1a1aa] to-[#52525b]",
    accent: "text-[#52525b] dark:text-[#d4d4d8]",
  },
  creator: {
    Icon: User,
    frame: "from-[#60a5fa] to-[#4f46e5]",
    accent: "text-[#2563eb] dark:text-[#7cb3fb]",
  },
  plus: {
    Icon: Users,
    frame: "from-[#22d3ee] to-[#0d9488]",
    accent: "text-[#0e7490] dark:text-[#5fe0f5]",
  },
  pro: {
    Icon: Rocket,
    frame: "from-[#34d399] to-[#0d9488]",
    accent: "text-[#047857] dark:text-[#6ee7b7]",
  },
  studio: {
    Icon: Briefcase,
    frame: "from-[#fbbf24] to-[#f97316]",
    accent: "text-[#a35a06] dark:text-[#fcc95a]",
  },
  agency: {
    Icon: Building2,
    frame: "from-[#fb923c] to-[#ef4444]",
    accent: "text-[#c2410c] dark:text-[#fdba74]",
  },
  scale: {
    Icon: Globe,
    frame: "from-[#f472b6] to-[#c026d3]",
    accent: "text-[#be1e70] dark:text-[#f9a2cd]",
  },
};
