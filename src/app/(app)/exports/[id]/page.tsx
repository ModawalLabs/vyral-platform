import { ArrowLeft, Layers, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ExportDetails } from "@/components/exports/export-details";
import { ExportStage } from "@/components/exports/export-stage";
import { PublishPanel } from "@/components/exports/publish-panel";
import { VersionSwitcher } from "@/components/exports/version-switcher";
import { Container } from "@/components/layout/container";
import { routes } from "@/config/routes";
import { listProviderConnections } from "@/data/account";
import { getExport } from "@/data/exports";
import { formatDate } from "@/lib/utils";

/** Next 16 hands params in as a promise, so both of these await it. */
type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const item = await getExport(id);
  // No `notFound()` here — that belongs to the page. Metadata for a missing record
  // just falls back to the section name.
  return { title: item ? item.title : "Exports" };
}

export default async function ExportDetailPage({ params }: Params) {
  const { id } = await params;

  /*
   * Fetched together: the export and the accounts it could be published to are
   * independent reads, and awaiting them in turn would stack their latency once these
   * are real network calls.
   */
  const [item, connections] = await Promise.all([
    getExport(id),
    listProviderConnections(),
  ]);

  // A 404 rather than a crash: a hand-typed or stale export id is a missing page, not
  // a server error.
  if (!item) notFound();

  return (
    // Not `PageShell`: the heading here carries a back link and a two-line subtitle,
    // which that component does not model. Same `Container` and vertical rhythm, so the
    // page still sits on the workspace's grid.
    <Container className="py-12">
      <div className="relative isolate">
        {/* The wash every other workspace page sits on. The panels below carry
            translucent plates and a gradient hairline, which need something to be
            translucent over. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-96 bg-[radial-gradient(60%_58%_at_50%_0%,color-mix(in_oklab,var(--brand)_11%,transparent),color-mix(in_oklab,var(--brand)_4%,transparent)_45%,transparent_78%)]"
        />

        <header className="mb-8">
          {/* A real link, so middle-click and open-in-new-tab work. Above the title
              rather than beside it, so the title keeps the full column width. */}
          <Link
            href={routes.exports}
            className="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            Exports
          </Link>

          {/*
            Title and subtitle on the left, the two things you can *do* to this export on
            the right. `items-end` so the controls sit on the subtitle's baseline rather
            than floating level with the title, and `flex-wrap` so they drop below it
            instead of squeezing the title on a narrow column.
          */}
          <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
                {item.title}
              </h1>

              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <Layers aria-hidden className="size-3.5 shrink-0" />
                <span className="tabular-nums">
                  {item.sceneCount} {item.sceneCount === 1 ? "scene" : "scenes"}
                </span>
                <span aria-hidden>·</span>
                {/* An absolute date: this page is the record of a delivery, and a record
                    wants a date you can quote rather than "2 days ago". */}
                <span>{formatDate(item.createdAt)}</span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <VersionSwitcher latest={item.version} />

              {/* Inert, and not `disabled`: a greyed-out Edit reads as "this export is
                  locked" rather than "this is not built yet". Same treatment as the
                  Settings profile's Edit. */}
              <button
                type="button"
                title="Editing is not wired up yet"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-foreground/[0.04] px-3.5 text-sm font-medium text-muted-foreground ring-1 ring-foreground/10 transition-colors ring-inset hover:bg-foreground/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Pencil aria-hidden className="size-3.5" />
                Edit
              </button>
            </div>
          </div>
        </header>

        {/*
          The cut on the left, its record on the right, publishing underneath.

          Five columns rather than three, because the stage wants noticeably more than
          two-thirds — a portrait frame in a narrow stage leaves the mat doing most of
          the work.

          The rows stretch rather than sitting at `items-start`, so the details panel
          matches the stage's height and the two bottom edges line up. Left to its own
          height it is barely a third as tall as the stage, which leaves an obvious hole
          in the column beside it; the panel's Download sits on `mt-auto` and drops to
          the new bottom on its own.
        */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ExportStage item={item} />
          </div>
          <div className="lg:col-span-2">
            <ExportDetails item={item} />
          </div>

          <div className="lg:col-span-5">
            <PublishPanel item={item} connections={connections} />
          </div>
        </div>
      </div>
    </Container>
  );
}
