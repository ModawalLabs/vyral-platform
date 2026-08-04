import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { ProjectSection } from "@/components/projects/project-section";
import { ProjectsToolbar } from "@/components/projects/projects-toolbar";
import { listProjects, listRecentProjects } from "@/data/projects";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  // Independent reads, so they overlap rather than waterfall. Keeps the page
  // honest once these become real network calls.
  const [recent, all] = await Promise.all([listRecentProjects(), listProjects()]);

  return (
    <PageShell title="Projects" description="Here’s what you have created so far !">
      <div className="flex flex-col gap-10">
        <ProjectsToolbar />

        <ProjectSection
          title="Recents"
          projects={recent}
          emptyMessage="Your latest generations will show up here."
        />

        <ProjectSection
          title="All"
          projects={all}
          emptyMessage="No projects yet — start with New video."
        />
      </div>
    </PageShell>
  );
}
