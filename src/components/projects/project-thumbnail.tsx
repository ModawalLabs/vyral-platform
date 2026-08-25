import { Clapperboard } from "lucide-react";
import Image from "next/image";

import type { Project } from "@/types/project";
import { cn } from "@/lib/utils";

/**
 * A project's poster frame, or the stand-in for one.
 *
 * Shared by the grid card and the mosaic on a folder tile so the two can never
 * disagree about what a project with no render yet looks like. The fallback is
 * brand-tinted rather than flat grey: an empty library should read as designed,
 * not as unfinished.
 *
 * A poster is a frame of a *finished* render, so a project that is still processing or
 * has failed shows the fallback whatever its `thumbnailUrl` says. Enforced here rather
 * than at the two call sites, and rather than only in the mock data: a picture sitting
 * under a "Failed" badge claims the render worked, and that contradiction should not be
 * one bad API response away.
 */
export function ProjectThumbnail({
  project,
  sizes,
  className,
  imageClassName,
  iconClassName,
  priority,
}: {
  project: Project;
  sizes: string;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
  priority?: boolean;
}) {
  if (project.thumbnailUrl && project.status === "ready") {
    return (
      <Image
        src={project.thumbnailUrl}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className, imageClassName)}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "grid h-full w-full place-items-center bg-gradient-to-br from-brand/15 via-muted to-muted",
        className,
      )}
    >
      <Clapperboard className={cn("size-7 text-muted-foreground/50", iconClassName)} />
    </div>
  );
}
