"use client";

import {
  Check,
  Download,
  LoaderCircle,
  Pencil,
  Play,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { ASPECT_RATIOS } from "@/components/home/composer-settings";
import { aspectFact, durationFact, RATIO_NUMBER } from "@/components/preview/facts";
import { usePreview } from "@/components/preview/preview-provider";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import type { Project } from "@/types/project";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

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
  onClick,
}: {
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
  disabledReason?: string;
  delay: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
 * Everything the tile offers appears on hover: edit, preview and download in the middle,
 * and a checkbox top-left. There is no select *mode* — the checkbox is simply one more
 * control, so filing a few projects away no longer means arming something first and
 * disarming it after.
 *
 * The overflow menu that used to sit top-right is gone with it. It carried "add to
 * folder" and "remove from folder" for a single project, and the checkbox now covers
 * both — tick one card and the selection bar offers exactly those two actions. One route
 * to a thing beats two.
 *
 * A ticked card keeps its checkbox and its ring when the pointer leaves, which is the
 * whole reason the reveal is conditional rather than a blanket `group-hover`: a selection
 * you cannot see while choosing the next one is not a selection.
 *
 * The two badges sit along the bottom edge rather than opposite corners, which leaves
 * the top-left corner free for the tick. The badges are labels, and a label should not be
 * the reason a control has nowhere to go.
 */
export function ProjectCard({
  project,
  selected = false,
  onToggleSelect,
  priority,
}: {
  project: Project;
  selected?: boolean;
  onToggleSelect?: () => void;
  priority?: boolean;
}) {
  const preview = usePreview();
  const badge = project.status === "ready" ? null : STATUS_BADGE[project.status];
  // Nothing to play or save until the render lands.
  const isReady = project.status === "ready";
  const notReady = project.status === "processing" ? "still processing" : "render failed";
  // Absent on a project that has not settled on a shape yet, so the caption simply
  // omits the mark rather than guessing at one.
  const aspect = ASPECT_RATIOS.find((option) => option.value === project.aspectRatio);

  return (
    <article
      data-slot="project-card"
      data-project={project.id}
      data-selected={selected ? "" : undefined}
      className="group min-w-0"
    >
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-xl ring-1 ring-border/60",
          "transition-[transform,box-shadow] duration-300",
          "group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-18px_color-mix(in_oklab,var(--brand)_60%,transparent)]",
          // Selection reads as a ring on the tile itself, not only as a tick: at four
          // cards a row the ticks are far apart and the pattern of *which* are chosen
          // has to be legible without reading each corner.
          selected && "ring-2 ring-brand",
        )}
      >
        <ProjectThumbnail
          project={project}
          sizes="(min-width: 1280px) 260px, (min-width: 768px) 33vw, 50vw"
          priority={priority}
          imageClassName="transition-transform duration-500 group-hover:scale-[1.05]"
        />

        {/*
          The checkbox.

          Revealed on hover like the rest, but pinned open once ticked — and `z-20` so it
          sits above the action overlay rather than under its scrim. Top-left, because
          the middle belongs to the three actions and the bottom edge to the badges.

          A real `checkbox` role with `aria-checked`, with the drawn box decorative: the
          tick is a `<span>` so a screen reader hears the state once rather than twice.
        */}
        {onToggleSelect ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Select ${project.title}`}
            onClick={onToggleSelect}
            data-slot="project-select"
            className={cn(
              "absolute top-2.5 left-2.5 z-20 grid size-6 place-items-center rounded-md border transition-[opacity,background-color,border-color]",
              "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
              selected
                ? "border-brand bg-brand text-brand-foreground opacity-100"
                : "border-white/70 bg-black/35 opacity-0 backdrop-blur-md hover:bg-black/55",
              // Only the unticked box has to be revealed; a ticked one is already at
              // full opacity above.
              "group-focus-within:opacity-100 group-hover:opacity-100",
              "[@media(hover:none)]:opacity-100",
            )}
          >
            {selected ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : null}
          </button>
        ) : null}

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
            onClick={() =>
              preview.open({
                id: project.id,
                title: project.title,
                eyebrow: "Project",
                media: {
                  thumbnailUrl: project.thumbnailUrl,
                  // Empty: the dialog's own title already names this video, so a
                  // description here would have a screen reader read it twice.
                  alt: "",
                  ratio: RATIO_NUMBER[project.aspectRatio ?? "16:8"],
                },
                prompt: project.prompt,
                facts: [
                  { label: "Model", value: project.model },
                  aspectFact(project.aspectRatio ?? "16:8"),
                  { label: "Resolution", value: project.resolution },
                  ...(project.durationSeconds
                    ? [durationFact(project.durationSeconds)]
                    : []),
                  { label: "Created", value: formatDate(project.createdAt) },
                ],
                // No primary action: the card's own hover row already offers edit
                // and download, and a project has nowhere else to go yet.
              })
            }
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
              "absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2 py-1 text-[11px] font-medium backdrop-blur-md",
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
        {/*
          A flex row rather than one truncating line.

          The ratio used to be appended as text — "4 weeks ago · 16:8" — and `16:8` is the
          app's own internal spelling, which says nothing to anyone who has not read the
          composer. The icon is the one from `ASPECT_RATIOS`, so the shape shown here and
          the shape offered when generating are the same mark.

          Flex because the date has to be the part that truncates: inside a single
          truncating line the icon is at the end and would be the first thing clipped, and
          an icon is no use half-drawn.
        */}
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{formatRelativeTime(project.createdAt)}</span>

          {aspect ? (
            <>
              <span aria-hidden className="opacity-50">
                ·
              </span>
              {/* The name is carried by the hidden text, not an `aria-label` on the
                  glyph: it lands in the reading order right where the ratio used to be,
                  and `title` gives pointer users the same word on hover. */}
              <span
                title={aspect.label}
                className="flex shrink-0 items-center"
                data-slot="aspect-icon"
                data-aspect={aspect.value}
              >
                <aspect.Icon aria-hidden className="size-3.5" />
                <span className="sr-only">{aspect.label}</span>
              </span>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}
