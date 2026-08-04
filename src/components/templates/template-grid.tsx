import { TemplateCard } from "@/components/templates/template-card";
import type { Template } from "@/types/template";

/**
 * The template library as a mixed-orientation grid.
 *
 * Square tracks, with each card spanning to its own shape: landscape takes two
 * columns and one row (2:1), portrait one column and two rows (1:2). Deriving both
 * from a single square unit is what lets the two orientations tile together instead
 * of leaving ragged rows.
 *
 * The row height has to equal the column width, and that is fiddlier than it looks:
 * a percentage in `grid-auto-rows` resolves against the container's *height*, not
 * its width, so the obvious `calc((100% - gap)/cols)` silently degrades to `auto` —
 * and an auto row sizes to content, which these cards have none of, collapsing them
 * to the height of their caption. Hence `cqw`, which is a width-derived length and
 * legal in a row context. It needs the `@container` wrapper: container units resolve
 * against an *ancestor* container, never the element's own box.
 *
 * `grid-flow-row-dense` backfills the holes a wide card leaves at the end of a row.
 * It does not eliminate them: 2×1 and 1×2 tiles in a fixed column count cannot tile
 * flush at this mix, so the last row stays a little ragged. That is what a masonry
 * gallery looks like, and it is why the grid caps at **four** columns — measured, six
 * columns left a conspicuous void mid-grid, four packs nearly tight and gives the
 * cards enough room to read as previews.
 */
export function TemplateGrid({ templates }: { templates: Template[] }) {
  if (templates.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No templates match that search yet.
      </p>
    );
  }

  return (
    <div className="@container">
      <div
        data-slot="template-grid"
        className={[
          "grid grid-flow-row-dense gap-3",
          // gap-3 is 0.75rem, so an n-column grid loses (n-1) × 0.75rem to gutters.
          "auto-rows-[calc((100cqw_-_0.75rem)/2)] grid-cols-2",
          "sm:auto-rows-[calc((100cqw_-_1.5rem)/3)] sm:grid-cols-3",
          "lg:auto-rows-[calc((100cqw_-_2.25rem)/4)] lg:grid-cols-4",
        ].join(" ")}
      >
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
