import type { SocialProvider } from "@/types/social";

/**
 * One field in a platform's publish form.
 *
 * A description rather than JSX, so the three forms are data and the renderer is one
 * component. Written as components instead, the shared field chrome would be copied
 * three times and the fourth platform would arrive looking subtly different.
 */
export type PublishField =
  | {
      kind: "text";
      name: string;
      label: string;
      placeholder?: string;
      /** Prefilled from the export, e.g. YouTube's title. */
      fillWith?: "title";
      /** Occupy the full row rather than half of it. */
      wide?: boolean;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      placeholder?: string;
      rows?: number;
    }
  | { kind: "select"; name: string; label: string; options: readonly string[] }
  | { kind: "toggle"; name: string; label: string; defaultOn?: boolean };

/**
 * What each platform asks for.
 *
 * Deliberately not one shared form: YouTube is the only one of the three that wants a
 * separate title, TikTok is the only one with duet permissions, and a single "caption
 * plus visibility" form would have been recognisably wrong on all three.
 *
 * The field names are the platform's own vocabulary — "Caption" on Instagram and
 * TikTok, "Description" on YouTube — because that is what someone cross-checking
 * against the real upload screen expects to see.
 */
export const PUBLISH_FORMS: Record<
  SocialProvider,
  { blurb: string; fields: readonly PublishField[] }
> = {
  youtube: {
    blurb: "Uploads to your channel as a new video.",
    fields: [
      {
        kind: "text",
        name: "title",
        label: "Title",
        placeholder: "Video title",
        fillWith: "title",
        wide: true,
      },
      {
        kind: "textarea",
        name: "description",
        label: "Description",
        placeholder: "What this video is about…",
        rows: 4,
      },
      {
        kind: "select",
        name: "visibility",
        label: "Visibility",
        options: ["Public", "Unlisted", "Private"],
      },
      { kind: "text", name: "tags", label: "Tags", placeholder: "cinematic, product" },
    ],
  },
  instagram: {
    blurb: "Posts as a Reel on your connected account.",
    fields: [
      {
        kind: "textarea",
        name: "caption",
        label: "Caption",
        placeholder: "Write a caption…",
        rows: 4,
      },
      {
        kind: "text",
        name: "collaborator",
        label: "Collaborator",
        placeholder: "@handle",
      },
      { kind: "text", name: "hashtags", label: "Hashtags", placeholder: "#reels #ai" },
      {
        kind: "toggle",
        name: "shareToFeed",
        label: "Also share to feed",
        defaultOn: true,
      },
    ],
  },
  tiktok: {
    blurb: "Publishes to your account as a new post.",
    fields: [
      {
        kind: "textarea",
        name: "caption",
        label: "Caption",
        placeholder: "Write a caption…",
        rows: 4,
      },
      {
        kind: "select",
        name: "privacy",
        label: "Who can view",
        options: ["Everyone", "Friends", "Only me"],
      },
      { kind: "toggle", name: "comments", label: "Allow comments", defaultOn: true },
      { kind: "toggle", name: "duet", label: "Allow duet and stitch" },
    ],
  },
};
