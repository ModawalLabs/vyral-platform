"use client";

import { Clapperboard, Maximize2 } from "lucide-react";
import Image from "next/image";

import { aspectFact, durationFact, RATIO_NUMBER } from "@/components/preview/facts";
import { usePreview } from "@/components/preview/preview-provider";
import type { Template } from "@/types/template";
import { cn } from "@/lib/utils";

/**
 * One template in the library.
 *
 * Sizing comes from the grid, not from an `aspect-*` class: `TemplateGrid` gives a
 * landscape card two columns and a portrait card two rows over square tracks, so
 * the box is already the right shape. Setting a ratio here as well would fight it.
 *
 * `group` on the article rather than the button, so the whole card lifts and the
 * overlay resolves together — `group-focus-within` is what carries that to keyboard
 * users, who never trigger `:hover`.
 */
export function TemplateCard({ template }: { template: Template }) {
  const preview = usePreview();

  const open = () =>
    preview.open({
      id: template.id,
      title: template.title,
      eyebrow: template.category,
      media: {
        thumbnailUrl: template.thumbnailUrl,
        alt: "",
        ratio: RATIO_NUMBER[template.aspectRatio],
      },
      prompt: template.prompt,
      facts: [
        { label: "Model", value: template.model },
        aspectFact(template.aspectRatio),
        { label: "Resolution", value: template.resolution },
        durationFact(template.durationSeconds),
        { label: "Remixed", value: `${template.uses.toLocaleString("en-GB")} times` },
      ],
      // Inert, like the button this replaced — there is nowhere to hand a template to
      // yet. The dialog closes either way, so it reads as pending rather than broken.
      action: { label: "Use template", title: "Using a template is not wired up yet" },
    });

  return (
    <article
      data-slot="template-card"
      data-orientation={template.aspectRatio === "16:8" ? "landscape" : "portrait"}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40",
        "transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10",
        "focus-within:border-brand/40",
        template.aspectRatio === "16:8"
          ? "col-span-2 row-span-1"
          : "col-span-1 row-span-2",
      )}
    >
      {template.thumbnailUrl ? (
        <Image
          src={template.thumbnailUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      ) : (
        // No preview yet, so the tile is the placeholder rather than an empty box.
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand/[0.07] via-transparent to-brand/[0.04] text-muted-foreground/40"
        >
          <Clapperboard className="size-7" />
        </span>
      )}

      {/* Scrim only behind the text, so the placeholder art stays readable. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent p-3 pt-10">
        <p className="text-xs font-medium text-white/70">{template.category}</p>
        <h3 className="mt-0.5 text-sm leading-snug font-semibold text-balance text-white">
          {template.title}
        </h3>
        <p className="mt-1 text-[11px] text-white/60 tabular-nums">
          {template.durationSeconds}s · {template.uses.toLocaleString("en-GB")} uses
        </p>
      </div>

      {/*
        The action covers the whole card, so the target is the tile rather than a
        small button — and it stays a real button, so it is reachable by keyboard and
        carries the template's name instead of a bare "Preview".

        It opens the preview dialog rather than using the template outright: a template
        is a prompt you are about to adopt, and adopting one sight-unseen is the thing
        the dialog exists to prevent. "Use template" is the dialog's own action.
      */}
      <button
        type="button"
        onClick={open}
        aria-label={`Preview template: ${template.title}`}
        className="absolute inset-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
      >
        <span
          className={cn(
            "absolute inset-x-0 top-0 flex items-center justify-center gap-1.5 p-3",
            "text-xs font-semibold text-white opacity-0 transition-opacity duration-200",
            "group-focus-within:opacity-100 group-hover:opacity-100",
          )}
        >
          <Maximize2 aria-hidden className="size-3.5" />
          Preview
        </span>
      </button>
    </article>
  );
}
