"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to — the value only differs between server and client. */
const subscribe = () => () => {};

/**
 * `false` during SSR and the hydration pass, `true` afterwards. Use it to defer
 * rendering anything that depends on browser-only state (theme, localStorage,
 * window size) and would otherwise cause a hydration mismatch.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
