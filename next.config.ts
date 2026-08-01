import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Fail the build early on a bad env rather than at runtime in production.
import "./src/env";

/**
 * Applied to every response. CSP is deliberately omitted here — it needs a
 * per-request nonce to work with Next's inline scripts, so add it in
 * `src/proxy.ts` when you're ready to lock scripts down.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Emits a minimal server bundle for small container images.
  output: "standalone",

  // Don't advertise the framework version.
  poweredByHeader: false,

  typedRoutes: true,

  experimental: {
    // Tree-shakes barrel imports from large icon/component packages.
    optimizePackageImports: ["lucide-react"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Add remote CDN/storage hostnames here as they are introduced.
    remotePatterns: [],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default bundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
