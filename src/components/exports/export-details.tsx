import { Download } from "lucide-react";

import { PromptBlock } from "@/components/media/prompt-block";
import { EXPORT_STATUS_META } from "@/components/exports/export-status";
import { Panel, PanelBevel, PanelLabel } from "@/components/ui/panel";
import { ASPECT_RATIOS } from "@/components/home/composer-settings";
import { cn } from "@/lib/utils";
import type { VideoExport } from "@/types/export";

/**
 * What this render was made with, and how to get it.
 *
 * A record rather than a control panel: every value here is fixed by the time an
 * export exists, so none of it is editable. That is why it reads as a definition list
 * and not as the Production Workspace's row of setting pills.
 *
 * The prompt sits between the record and Download — see `PromptBlock` for why it
 * belongs in this panel rather than under the video.
 *
 * Version is deliberately *not* here even though it is part of the same record — it is
 * the one value you can change, so it lives in the header's switcher. Listing it in
 * both places would leave two controls-shaped things disagreeing about which is
 * authoritative.
 */
export function ExportDetails({ item }: { item: VideoExport }) {
  const status = EXPORT_STATUS_META[item.status];
  const isReady = item.status === "completed";

  // Shown as `16:8 · Landscape`, the same way the workspace's aspect pill spells it —
  // the bare ratio is the app's internal vocabulary and means little on its own.
  const aspect =
    ASPECT_RATIOS.find((option) => option.value === item.aspectRatio) ?? ASPECT_RATIOS[0];

  return (
    <Panel>
      <PanelBevel />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <PanelLabel>Render</PanelLabel>
          {/* On the panel's own surface, so this uses the theme-reactive status colour
              rather than the fixed `-on-media` one the poster badge needs. */}
          <span
            data-slot="detail-status"
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase",
              status.onSurface,
            )}
          >
            <status.Icon
              aria-hidden
              className={cn("size-3", item.status === "processing" && "animate-spin")}
            />
            {status.label}
          </span>
        </div>

        <dl className="grid gap-4">
          <Row label="Model" value={item.model} />
          <Row label="Aspect ratio" value={`${aspect.value} · ${aspect.label}`} />
          <Row label="Resolution" value={item.resolution} />
        </dl>

        <PromptBlock prompt={item.prompt} />

        {/* TODO: serves the rendered file once there is one. Disabled rather than
            inert: a download that cannot happen because the render is unfinished is a
            real state with a real explanation, unlike a button whose backend is simply
            missing. */}
        <button
          type="button"
          disabled={!isReady}
          title={
            isReady
              ? "Downloading is not wired up yet"
              : `Available once the ${status.label.toLowerCase()} render finishes`
          }
          className={cn(
            "mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
            "bg-foreground/[0.04] text-foreground ring-1 ring-foreground/10 ring-inset",
            "hover:bg-foreground/[0.08]",
            "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-45",
          )}
        >
          <Download aria-hidden className="size-4" />
          Download
        </button>
      </div>
    </Panel>
  );
}

/** One labelled fact. Label left, value right, both on one line. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      {/* `text-right` so the values form a column against the panel's right edge,
          which is what makes four unrelated facts scan as a set. */}
      <dd className="truncate text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
