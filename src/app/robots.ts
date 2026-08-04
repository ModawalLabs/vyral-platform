import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/new", "/projects/", "/templates/", "/settings/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
