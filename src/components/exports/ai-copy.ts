import type { VideoExport } from "@/types/export";
import type { SocialProvider } from "@/types/social";

/**
 * Stand-in for the copy a model would write.
 *
 * Built from the export's own facts — its title, how many beats it was cut into, the
 * model that rendered it, the frame and the resolution — rather than from lorem or a
 * fixed string. That is the difference between a button that looks like it did something
 * and one that looks like it read the video: change the export and the text changes with
 * it.
 *
 * Two variants per voice, cycled on each press, so clicking again gives a genuinely
 * different draft instead of the same sentence twice.
 *
 * TODO: replace the whole module with a call to the generation API. The signature is
 * already the one that call would have.
 */

/** Long-form. YouTube gives a description real room, so it gets paragraphs. */
function longForm(item: VideoExport, variant: number): string {
  const drafts = [
    `${item.title} — a ${item.sceneCount}-scene cut, generated end to end and finished at ${item.resolution}.\n\n` +
      `Written as a single prompt, broken into ${item.sceneCount} beats, then rendered with ${item.model} in ${item.aspectRatio}. No crew, no location, no reshoots.\n\n` +
      `Made with Vyral.`,

    `We wrote one prompt and let the director do the rest. ${item.sceneCount} beats, ${item.model}, ${item.resolution} — start to finish without a camera.\n\n` +
      `${item.title} is the ${item.aspectRatio} cut. Tell us which beat you would change.\n\n` +
      `Made with Vyral.`,
  ];
  return drafts[variant % drafts.length];
}

/** Short-form. A hook, one line of substance, then tags. */
function shortForm(item: VideoExport, variant: number): string {
  const tag = item.model.toLowerCase().replace(/[^a-z0-9]/g, "");
  const drafts = [
    `${item.title} — one prompt, ${item.sceneCount} beats, zero crew. ✨\n\n` +
      `#aivideo #vyral #${tag} #madewithai`,

    `No camera. No set. ${item.sceneCount} scenes rendered with ${item.model}.\n\n` +
      `${item.title} 👇\n\n#aivideo #vyral #${tag} #contentcreation`,
  ];
  return drafts[variant % drafts.length];
}

/**
 * The voice each destination writes in.
 *
 * `all` gets the short form on purpose: a shared caption has to survive on the strictest
 * surface it will land on, and a YouTube-length paragraph pasted into a Reel is worse
 * than a short caption sitting under a YouTube video.
 */
export function aiCopyFor(
  destination: SocialProvider | "all",
  item: VideoExport,
  variant: number,
): string {
  return destination === "youtube" ? longForm(item, variant) : shortForm(item, variant);
}
