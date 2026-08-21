import { Clapperboard, Download, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EXPORT_STATUS_META } from "@/components/exports/export-status";
import { Panel, PanelBevel } from "@/components/ui/panel";
import { routes } from "@/config/routes";
import { cn, formatDate } from "@/lib/utils";
import type { VideoExport } from "@/types/export";

/**
 * One delivered cut.
 *
 * The poster leads and bleeds to the card's edges — an export is a *video*, so the
 * frame is the thing you recognise it by, and metadata below it is how you tell two
 * versions of the same video apart.
 *
 * Everything is driven off the `VideoExport` contract, including the missing-poster
 * fallback, so the same component covers today's mocks and real posters later without
 * a branch at the call site.
 */
export function ExportCard({
  item,
  priority = false,
}: {
  item: VideoExport;
  /**
   * Preload this poster instead of lazy-loading it.
   *
   * Set on the cards in the first row. One of them is the page's Largest Contentful
   * Paint, and a lazily-loaded LCP image is fetched only after layout — Next warns
   * about exactly this. Left off the rest so the tail of the grid does not compete
   * with the fold for bandwidth.
   */
  priority?: boolean;
}) {
  const status = EXPORT_STATUS_META[item.status];
  const isReady = item.status === "completed";

  return (
    // `group` so the poster can respond to hover anywhere on the card rather than only
    // over the image itself. `relative` for the overlay link at the bottom.
    <Panel className="group relative">
      <PanelBevel />

      <div className="relative aspect-video shrink-0 overflow-hidden">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            // Decorative: the title sits directly beneath in real text, so describing
            // the frame here would have a screen reader read the same card twice.
            alt=""
            fill
            priority={priority}
            // Three columns at the widest, so a card is never more than a third of the
            // content column — and full width once the grid stacks.
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 40vw, 90vw"
            className={cn(
              "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none",
              // A cut that is not finished should not look like one you can watch.
              !isReady && "opacity-60 saturate-50",
            )}
          />
        ) : (
          <div className="grid size-full place-items-center bg-muted/40 text-muted-foreground/60">
            <Clapperboard aria-hidden className="size-7" />
          </div>
        )}

        {/*
          Scrim, top and bottom. The badges sit in the corners, and stock artwork can
          be any brightness there — without it the status is legible on one poster and
          invisible on the next. Two short gradients rather than one flat overlay, so
          the middle of the frame stays untouched.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60"
        />

        {/* Status, top-left. The `-on-media` tokens are fixed across themes because
            this scrim is dark in both. */}
        <span
          data-slot="export-status"
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white/90 ring-1 ring-white/15 backdrop-blur-md ring-inset"
        >
          <status.Icon
            aria-hidden
            className={cn(
              "size-3",
              status.onMedia,
              // The only motion on the card, and only where it means something.
              item.status === "processing" && "animate-spin",
            )}
          />
          {status.label}
        </span>

        {/* Version, top-right — the field that distinguishes two exports of the same
            video, so it belongs on the frame rather than buried in the meta line. */}
        <span
          data-slot="export-version"
          className="absolute top-3 right-3 rounded-full bg-black/35 px-2 py-1 text-[11px] font-semibold text-white/90 tabular-nums ring-1 ring-white/15 backdrop-blur-md ring-inset"
        >
          v{item.version}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-sm font-semibold tracking-tight">
            {item.title}
          </h3>
          {/*
            Scene count and date on one line, separated by a middot. Both are small
            facts about the same render, and stacking them would give a two-line meta
            block more weight than the title above it.
          */}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers aria-hidden className="size-3 shrink-0" />
            <span className="tabular-nums">
              {item.sceneCount} {item.sceneCount === 1 ? "scene" : "scenes"}
            </span>
            <span aria-hidden>·</span>
            {/* An absolute date, not "2 days ago": an export is a record of what was
                delivered, and a record wants a date you can quote. */}
            <span className="truncate">{formatDate(item.createdAt)}</span>
          </p>
        </div>

        {/* TODO: serves the rendered file once there is one. Disabled rather than
            inert here, unlike the settings page — a download that cannot happen
            because the render is not finished is a real, explainable state. */}
        <button
          type="button"
          disabled={!isReady}
          title={
            isReady
              ? "Downloading is not wired up yet"
              : `Available once the ${status.label.toLowerCase()} render finishes`
          }
          className={cn(
            // `relative z-20` lifts it above the overlay link, which is the only way
            // both stay clickable — see the link below.
            "relative z-20 mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors",
            "ring-1 ring-foreground/10 ring-inset",
            "hover:bg-foreground/[0.06] hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-45",
            isReady ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Download aria-hidden className="size-3.5" />
          Download
        </button>
      </div>

      {/*
        The whole card is the link, as an absolutely-positioned overlay rather than a
        `<Link>` wrapped around everything.

        Wrapping would put the Download `<button>` inside an `<a>`, which is invalid
        HTML — nested interactive content — and leaves the browser to guess which one a
        click meant. An overlay keeps one anchor and one button as siblings, and the
        button sits above it on `z-20`.

        The accessible name is spelled out because the anchor has no text of its own;
        without it a screen reader announces five identical "link" entries.
      */}
      <Link
        href={`${routes.exports}/${item.id}`}
        aria-label={`${item.title} — version ${item.version}`}
        className="absolute inset-0 z-10 rounded-[calc(var(--radius-2xl)-1px)] focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
      />
    </Panel>
  );
}
