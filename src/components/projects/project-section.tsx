import type { ReactNode } from "react";

import { ProjectCard } from "@/components/projects/project-card";
import type { Project } from "@/types/project";

/**
 * A titled block of project cards.
 *
 * Both sections on the page use this, so "Recents" and "All" can never drift
 * apart visually — only the array they are handed differs.
 */
export function ProjectSection({
  title,
  projects,
  action,
  emptyMessage = "Nothing here yet.",
}: {
  title: string;
  projects: Project[];
  action?: ReactNode;
  emptyMessage?: string;
}) {
  return (
    <section className="min-w-0">
      <header className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {action}
      </header>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}
