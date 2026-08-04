import { FolderPlus, Plus } from "lucide-react";

import { routes } from "@/config/routes";
import { BrandLink } from "@/components/ui/brand-button";
import { SearchField } from "@/components/ui/search-field";

/**
 * Search + primary actions for the project library.
 *
 * Server-rendered and stateless for now; see `SearchField` for what wiring the
 * search up will involve.
 */
export function ProjectsToolbar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchField
        id="project-search"
        label="Search projects"
        placeholder="Search projects"
      />

      <div className="flex items-center gap-2 sm:ml-auto">
        {/* Secondary: outlined, so it never competes with New video. */}
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <FolderPlus className="size-4" />
          New folder
        </button>

        <BrandLink href={routes.newVideo}>
          New video
          <Plus className="size-4" />
        </BrandLink>
      </div>
    </div>
  );
}
