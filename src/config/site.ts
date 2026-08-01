import { env } from "@/env";

export const siteConfig = {
  name: "Vyral",
  shortName: "Vyral",
  description: "The platform for building and scaling what comes next.",
  url: env.NEXT_PUBLIC_APP_URL,
  ogImage: "/opengraph-image.png",
  locale: "en_US",
  links: {
    twitter: "https://twitter.com/vyral",
    github: "https://github.com/vyral",
  },
} as const;

export type SiteConfig = typeof siteConfig;
