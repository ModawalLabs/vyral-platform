import "server-only";

import { resolvePage } from "@/lib/pagination";
import type { Page } from "@/types/pagination";
import type { Template } from "@/types/template";

/**
 * Template data access.
 *
 * The only file that needs to change when the API lands: keep the signature and
 * replace the body with a `fetch`/database call that takes an offset and a limit.
 * The page already awaits it and reads the envelope, so no component is touched.
 *
 * `server-only` makes that swap safe — importing this from a client component
 * fails the build rather than shipping the mock (or, later, a credential) to the
 * browser.
 */

/** One screenful. Fifteen per page, five landscape and ten portrait. */
export const TEMPLATES_PER_PAGE = 15;

const SEEDS: Array<Pick<Template, "title" | "category">> = [
  { title: "Neon alley chase", category: "Cinematic" },
  { title: "Espresso pour, macro", category: "Product" },
  { title: "Sneaker drop teaser", category: "Product" },
  { title: "Black sand aerial", category: "Aerial" },
  { title: "VHS birthday party", category: "Retro" },
  { title: "Studio pedestal spin", category: "Product" },
  { title: "Golden hour field", category: "Lifestyle" },
  { title: "Rooftop timelapse", category: "Cinematic" },
  { title: "Paper crane flock", category: "Motion" },
  { title: "Cliffside drone pull", category: "Aerial" },
  { title: "Unboxing, top-down", category: "Product" },
  { title: "Cafe window rain", category: "Lifestyle" },
  { title: "Skyline light trails", category: "Cinematic" },
  { title: "Recipe reel, overhead", category: "Social" },
  { title: "Founder talking head", category: "Social" },
];

/**
 * The repeating shape of a page: landscape, then two portraits, five times over.
 *
 * Written as a pattern rather than hand-authored per item so **every** page comes
 * out five landscape and ten portrait — including the last one, and including any
 * page added later. Hand-listing 45 ratios would have drifted the first time
 * somebody inserted a template.
 */
const RATIO_CYCLE: Template["aspectRatio"][] = ["16:8", "8:16", "8:16"];

// TODO: remove once the API is wired up. Three pages' worth, so the pagination
// control has something real to page through.
const MOCK_TEMPLATES: Template[] = Array.from(
  { length: TEMPLATES_PER_PAGE * 3 },
  (_, index) => {
    const seed = SEEDS[index % SEEDS.length];
    const pass = Math.floor(index / SEEDS.length);

    return {
      id: `t_${String(index + 1).padStart(2, "0")}`,
      // Later passes reuse the seed titles, so distinguish them rather than
      // rendering the same card three times.
      title: pass === 0 ? seed.title : `${seed.title} ${pass + 1}`,
      category: seed.category,
      aspectRatio: RATIO_CYCLE[index % RATIO_CYCLE.length],
      durationSeconds: 6 + (index % 10),
      uses: 480 + index * 137,
    };
  },
);

/**
 * One page of templates.
 *
 * Takes the raw `?page=` value and clamps it here rather than at the call site:
 * the total is only known on this side, and `Page.page` is defined as what was
 * actually served, which may differ from what was asked for.
 */
export async function listTemplates(
  requestedPage: string | undefined,
): Promise<Page<Template>> {
  const total = MOCK_TEMPLATES.length;
  const pageCount = Math.max(1, Math.ceil(total / TEMPLATES_PER_PAGE));
  const page = resolvePage(requestedPage, pageCount);
  const start = (page - 1) * TEMPLATES_PER_PAGE;

  return {
    items: MOCK_TEMPLATES.slice(start, start + TEMPLATES_PER_PAGE),
    page,
    pageCount,
    total,
  };
}
