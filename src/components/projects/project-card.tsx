import {
  Clapperboard,
  Download,
  LoaderCircle,
  Pencil,
  Play,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import type { Project } from "@/types/project";
import { cn, formatRelativeTime } from "@/lib/utils";

const STATUS_BADGE = {
  processing: {
    label: "Processing",
    Icon: LoaderCircle,
    textClass: "text-warning-on-media",
  },
  failed: { label: "Failed", Icon: TriangleAlert, textClass: "text-danger-on-media" },
} as const;

/**
 * A single hover action.
 *
 * Icon-only, so the label lives in `aria-label` (screen readers) and `title`
 * (pointer users) — one without the other leaves one group guessing.
 *
 * The delay is applied only in the hover state. Putting it on the base class
 * would also delay the exit, which reads as lag when the pointer leaves.
 */
function CardAction({
  label,
  Icon,
  disabled,
  disabledReason,
  delay,
}: {
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
  disabledReason?: string;
  delay: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={disabled && disabledReason ? `${label} — ${disabledReason}` : label}
      title={disabled && disabledReason ? `${label} — ${disabledReason}` : label}
      className={cn(
        "grid size-9 translate-y-2 place-items-center rounded-full text-white",
        "bg-white/15 ring-1 ring-white/25 backdrop-blur-md",
        "transition-[transform,background-color,opacity] duration-300",
        "group-focus-within:translate-y-0 group-hover:translate-y-0",
        delay,
        "hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

/**
 * One project in the library.
 *
 * Everything is driven off the `Project` contract, including the fallback: a
 * card with no `thumbnailUrl` renders the placeholder tile, so the same
 * component covers both mock data today and real posters later with no branch
 * at the call site.
 */
export function ProjectCard({ project }: { project: Project }) {
  const badge = project.status === "ready" ? null : STATUS_BADGE[project.status];
  // Nothing to play or save until the render lands.
  const isReady = project.status === "ready";
  const notReady = project.status === "processing" ? "still processing" : "render failed";

  return (
    <article className="group min-w-0">
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-xl ring-1 ring-border/60",
          "transition-[transform,box-shadow] duration-300",
          "group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-18px_color-mix(in_oklab,var(--brand)_60%,transparent)]",
        )}
      >
        {project.thumbnailUrl ? (
          <Image
            src={project.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 260px, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          /* Placeholder tile. Brand-tinted rather than flat grey so an empty
             library still looks designed instead of unfinished. */
          <div
            aria-hidden
            className="grid h-full w-full place-items-center bg-gradient-to-br from-brand/15 via-muted to-muted"
          >
            <Clapperboard className="size-7 text-muted-foreground/50" />
          </div>
        )}

        {/*
         * Action overlay.
         *
         * `group-focus-within` matters as much as `group-hover`: these controls
         * stay focusable while transparent, so tabbing into one reveals the set
         * instead of moving focus somewhere invisible.
         *
         * `(hover: none)` pins it open on touch, where there is no hover state
         * to discover and the buttons would otherwise be unreachable.
         */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center gap-2",
            "bg-gradient-to-t from-black/75 via-black/35 to-black/20 backdrop-blur-[2px]",
            "opacity-0 transition-opacity duration-200",
            "group-focus-within:opacity-100 group-hover:opacity-100",
            "[@media(hover:none)]:opacity-100",
          )}
        >
          <CardAction label="Edit" Icon={Pencil} delay="group-hover:delay-0" />
          <CardAction
            label="Preview"
            Icon={Play}
            disabled={!isReady}
            disabledReason={notReady}
            delay="group-hover:delay-75"
          />
          <CardAction
            label="Download"
            Icon={Download}
            disabled={!isReady}
            disabledReason={notReady}
            delay="group-hover:delay-150"
          />
        </div>

        {/* Rendered after the overlay so the badges stay legible on top of it. */}
        {badge ? (
          <span
            className={cn(
              "absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2 py-1 text-[11px] font-medium backdrop-blur-md",
              badge.textClass,
            )}
          >
            <badge.Icon
              className={cn("size-3", project.status === "processing" && "animate-spin")}
            />
            {badge.label}
          </span>
        ) : null}

        {project.durationSeconds ? (
          <span className="absolute right-2.5 bottom-2.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums backdrop-blur-md">
            {project.durationSeconds}s
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 min-w-0">
        <p className="truncate text-sm font-medium">{project.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatRelativeTime(project.createdAt)}
          {project.aspectRatio ? ` · ${project.aspectRatio}` : ""}
        </p>
      </div>
    </article>
  );
}
