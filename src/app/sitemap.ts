import type { MetadataRoute } from "next";

import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

/**
 * Static entries only. Once content is database-backed, fetch slugs here and
 * split into multiple sitemaps via `generateSitemaps` — a single file caps at
 * 50,000 URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // The workspace itself sits behind auth, so only the entry points are listed.
  const publicRoutes = [routes.home, routes.signIn, routes.signUp];

  return publicRoutes.map((route) => ({
    url: `${siteConfig.url}${route === "/" ? "" : route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === routes.home ? 1 : 0.8,
  }));
}
