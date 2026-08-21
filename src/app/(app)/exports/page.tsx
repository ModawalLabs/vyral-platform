import type { Metadata } from "next";

import { ExportCard } from "@/components/exports/export-card";
import { StatusFilter } from "@/components/exports/status-filter";
import { PageShell } from "@/components/layout/page-shell";
import { countExportsByStatus, listExports } from "@/data/exports";

export const metadata: Metadata = { title: "Exports" };

export default async function ExportsPage() {
  /*
   * Fetched together rather than one await after another.
   *
   * The two are independent, so sequential awaits would stack their latency for no
   * reason once these are real network calls. They are instant today, which is exactly
   * why the shape has to be right now — a serial chain here is invisible until it is in
   * production.
   */
  const [items, counts] = await Promise.all([listExports(), countExportsByStatus()]);

  return (
    <PageShell
      title="Exports"
      description="Every cut you have rendered out, newest first."
    >
      {/* `isolate` so the wash below can sit at `-z-10` without dropping behind the
          page background. */}
      <div className="relative isolate">
        {/*
          The same brand wash the home rails and the settings panels sit on. The cards
          here carry translucent plates and a gradient hairline, which need something
          to be translucent *over* — on a bare page background they read as flat boxes.
        */}
        <div
          aria-hidden
          data-slot="exports-wash"
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-96 bg-[radial-gradient(60%_58%_at_50%_0%,color-mix(in_oklab,var(--brand)_11%,transparent),color-mix(in_oklab,var(--brand)_4%,transparent)_45%,transparent_78%)]"
        />

        <div className="@container flex flex-col gap-7">
          <StatusFilter counts={counts} />

          {/*
            Columns by *container* width, not viewport.

            `md:`/`lg:` would measure the window, but this grid only ever gets the
            window minus a 256px sidebar that never collapses — which is how the
            settings tiles ended up with 91px each at a 660px viewport. 34rem and 52rem
            are the widths at which two and three cards still leave a readable poster.
          */}
          <div
            data-slot="export-grid"
            className="grid gap-6 @min-[34rem]:grid-cols-2 @min-[52rem]:grid-cols-3"
          >
            {items.map((item, index) => (
              // The first row is above the fold at every column count this grid
              // reaches, so those posters are preloaded rather than lazy-loaded.
              <ExportCard key={item.id} item={item} priority={index < 3} />
            ))}
          </div>

          {/* The list is seeded, so this is unreachable today — kept because an empty
              grid with a filter above it is the one state that looks broken rather
              than empty. */}
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Nothing exported yet. Finish a production and it will appear here.
            </p>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
