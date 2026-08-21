import { CircleCheck, LoaderCircle, TriangleAlert, type LucideIcon } from "lucide-react";

import type { ExportStatus } from "@/types/export";

/**
 * How each status presents itself.
 *
 * Two colour sets per status, because the same word appears on two very different
 * backgrounds:
 *
 * - `onMedia` sits on the poster, over a dark scrim. Those tokens are fixed across
 *   themes on purpose (see `globals.css`) — the scrim is dark in both, so a
 *   theme-reactive colour would go dark on dark exactly where it must not.
 * - `onSurface` sits on the card's own plate, and does flip with the theme.
 *
 * Keeping both on one record is what stops the poster badge and the filter pill
 * drifting into two different greens.
 */
export const EXPORT_STATUS_META: Record<
  ExportStatus,
  { label: string; Icon: LucideIcon; onMedia: string; onSurface: string }
> = {
  completed: {
    label: "Completed",
    Icon: CircleCheck,
    onMedia: "text-success-on-media",
    onSurface: "text-success",
  },
  processing: {
    label: "Processing",
    Icon: LoaderCircle,
    onMedia: "text-warning-on-media",
    onSurface: "text-stale",
  },
  failed: {
    label: "Failed",
    Icon: TriangleAlert,
    onMedia: "text-danger-on-media",
    onSurface: "text-destructive",
  },
};
