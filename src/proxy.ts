import { NextResponse, type NextRequest } from "next/server";

import { protectedPrefixes } from "@/config/routes";

/**
 * Runs on the Edge before every matched request (the Next 16 replacement for
 * `middleware`). Keep it cheap — it is on the critical path for every page
 * view. No database calls here; check a session cookie's presence and let the
 * page or route handler do real verification.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Correlates a browser request with every server log line it produces.
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    // TODO: replace with the real session check once auth is chosen, e.g.
    //   const session = request.cookies.get(SESSION_COOKIE);
    //   if (!session) {
    //     const url = request.nextUrl.clone();
    //     url.pathname = routes.signIn;
    //     url.searchParams.set("next", pathname);
    //     return NextResponse.redirect(url);
    //   }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  /**
   * Skip static assets and image optimization — running the proxy on those
   * burns Edge invocations for no benefit.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
