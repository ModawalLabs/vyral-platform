import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { ProjectsLibrary } from "@/components/projects/projects-library";
import { listFolders, listProjects } from "@/data/projects";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  // Independent reads, so they overlap rather than waterfall. Keeps the page
  // honest once these become real network calls.
  const [projects, folders] = await Promise.all([listProjects(), listFolders()]);

  /*
   * Everything below the heading is one client component.
   *
   * Folders, filters and selection all read each other — see the note on
   * `ProjectsLibrary` — so there is no seam to split on. The data still comes from
   * the server, which is what keeps `src/data/projects.ts` `server-only` and off the
   * client bundle.
   */
  return (
    <PageShell title="Projects" description="Here’s what you have created so far !">
      <ProjectsLibrary projects={projects} folders={folders} />
    </PageShell>
  );
}
