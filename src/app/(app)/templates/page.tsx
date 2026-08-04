import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { TemplateGrid } from "@/components/templates/template-grid";
import { TemplatePagination } from "@/components/templates/template-pagination";
import { SearchField } from "@/components/ui/search-field";
import { listTemplates } from "@/data/templates";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage({
  searchParams,
}: {
  // A promise in Next 16: `searchParams` is async so a page can start rendering
  // before the request's params are resolved.
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: requested } = await searchParams;
  // The data layer clamps rather than the page: it is the only side that knows the
  // total, and a hand-edited `?page=99` should serve the last page, not an empty grid.
  const { items, page, pageCount, total } = await listTemplates(requested);

  return (
    <PageShell
      title="Templates"
      description="Starting points you can remix instead of prompting from scratch."
    >
      <div className="flex flex-col gap-8">
        <SearchField
          id="template-search"
          label="Search templates"
          placeholder="Search templates"
        />

        <TemplateGrid templates={items} />

        <div className="flex flex-col items-center gap-3">
          <TemplatePagination page={page} pageCount={pageCount} />
          <p className="text-xs text-muted-foreground tabular-nums">
            Page {page} of {pageCount} · {total} templates
          </p>
        </div>
      </div>
    </PageShell>
  );
}
