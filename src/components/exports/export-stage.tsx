import { Clapperboard } from "lucide-react";
import Image from "next/image";

import { ASPECT_CLASS } from "@/components/create/aspect";
import { Panel, PanelBevel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import type { VideoExport } from "@/types/export";

/**
 * The cut itself — a poster frame standing in for the player.
 *
 * The whole point of this component is that the video can be either shape.
 *
 * The stage is a **fixed-height** box and the frame inside derives its width from that
 * height, rather than the frame sizing itself from the column and the stage growing to
 * follow. Let a portrait frame drive a full-width card and it becomes twice the
 * column's width tall — on a 700px column that is a 1400px card and the metadata beside
 * it ends up level with nothing. Pinning the height puts both ratios in the same box.
 *
 * `flex`, not `grid`: a grid row is auto-sized even when the grid itself has a fixed
 * height, so `h-full` on a grid child is indefinite and the aspect ratio resolves
 * width-first — which is the bug this shape exists to avoid.
 */
export function ExportStage({ item }: { item: VideoExport }) {
  const aspect = ASPECT_CLASS[item.aspectRatio];

  return (
    <Panel>
      <PanelBevel />

      {/*
        The mat around the frame is deliberately plain and slightly inset from the
        panel: a poster of unknown brightness needs a neutral surround, and a portrait
        cut leaves a lot of it on either side. `min-h-0` so the flex child can shrink
        rather than forcing the stage taller than its own height.
      */}
      <div
        data-slot="export-stage"
        className="flex h-[clamp(18rem,46vh,30rem)] min-h-0 items-center justify-center bg-foreground/[0.03] p-5"
      >
        <div
          data-slot="export-frame"
          className={cn(
            "relative h-full overflow-hidden rounded-xl ring-1 ring-foreground/10 ring-inset",
            // Height comes from the stage; the aspect class turns it into a width.
            aspect,
          )}
        >
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              // Decorative: the page's own heading names this video, so a description
              // here would have a screen reader read the title twice.
              alt=""
              fill
              // Height-driven, so the rendered width is a fraction of the viewport
              // that depends on the ratio. The larger of the two shapes is the honest
              // hint for the optimiser.
              sizes="(min-width: 1024px) 45vw, 90vw"
              priority
              className="object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center bg-muted/40 text-muted-foreground/60">
              <Clapperboard aria-hidden className="size-8" />
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
