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
import type { ReactNode } from "react";

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
 * Two modes. Normally the tile reveals edit/preview/download on hover and carries an
 * overflow menu for filing it away. In select mode all of that is replaced by a single
 * full-tile toggle — because a card that is both a set of buttons *and* a checkbox is a
 * card where every click is a guess. Entering select mode changes what a click means,
 * so it has to change what the card offers.
 *
 * The two badges sit along the bottom edge rather than opposite corners, which leaves
 * the top row free for the tick and the menu. Those two are the controls; the badges
 * are labels, and labels should not be the reason a control has nowhere to go.
 */
export function ProjectCard({
  project,
  selectMode = false,
  selected = false,
  onToggleSelect,
  menu,
  priority,
}: {
  project: Project;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Overflow menu, supplied by the library because only it knows the folders. */
  menu?: ReactNode;
  priority?: boolean;
}) {
  const preview = usePreview();
  const badge = project.status === "ready" ? null : STATUS_BADGE[project.status];
  // Nothing to play or save until the render lands.
  const isReady = project.status === "ready";
  const notReady = project.status === "processing" ? "still processing" : "render failed";

  return (
    <article
      data-slot="project-card"
      data-project={project.id}
      data-selected={selectMode && selected ? "" : undefined}
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
          selectMode && selected && "ring-2 ring-brand",
        )}
      >
        <ProjectThumbnail
          project={project}
          sizes="(min-width: 1280px) 260px, (min-width: 768px) 33vw, 50vw"
          priority={priority}
          imageClassName="transition-transform duration-500 group-hover:scale-[1.05]"
        />

        {selectMode ? (
          /*
           * The whole tile as one toggle.
           *
           * A cover button rather than a checkbox in the corner: at this size the
           * corner is a 20px target on a 260px tile, and every pointer user would aim
           * for the picture anyway. The real state is on the button, so a screen
           * reader gets `checkbox` + `aria-checked` and the drawn tick stays decorative.
           */
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Select ${project.title}`}
            onClick={onToggleSelect}
            className={cn(
              "absolute inset-0 z-10 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-inset",
              selected ? "bg-brand/20" : "bg-black/0 hover:bg-black/25",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-2.5 left-2.5 grid size-6 place-items-center rounded-full border transition-colors",
                selected
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-white/70 bg-black/35 backdrop-blur-md",
              )}
            >
              {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
            </span>
          </button>
        ) : (
          <>
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

            {menu ? (
              <div className="absolute top-2.5 right-2.5 z-20 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                {menu}
              </div>
            ) : null}
          </>
        )}

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
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatRelativeTime(project.createdAt)}
          {project.aspectRatio ? ` · ${project.aspectRatio}` : ""}
        </p>
      </div>
    </article>
  );
}
