/**
 * Sidebar collapse state lives in a cookie rather than localStorage so the
 * server can render the correct width on the first paint. localStorage is only
 * readable after hydration, which would make the sidebar visibly snap shut on
 * every reload for anyone who collapsed it.
 */
export const SIDEBAR_COOKIE = "vyral:sidebar-collapsed";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_COLLAPSED = "4.25rem";
