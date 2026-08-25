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
      /**
       * The caption or description — the one field the all-platforms form writes once
       * and sends everywhere.
       *
       * Flagged rather than inferred from `kind === "textarea"`. That happens to be
       * unambiguous today because each platform has exactly one, but a second textarea
       * on any platform would silently make the combined form pick the wrong field.
       */
      shared?: boolean;
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
        shared: true,
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
        shared: true,
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
        shared: true,
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

/**
 * The shared field for a platform, and everything else.
 *
 * Split here rather than in the component so both forms read the same definition: the
 * single-platform view renders `[shared, ...extras]` in order, and the all-platforms
 * view hoists every `shared` into one caption at the top and stacks the `extras` under
 * their platform.
 */
export function sharedFieldOf(provider: SocialProvider): PublishField | undefined {
  return PUBLISH_FORMS[provider].fields.find(
    (field) => field.kind === "textarea" && field.shared,
  );
}

export function extraFieldsOf(provider: SocialProvider): readonly PublishField[] {
  return PUBLISH_FORMS[provider].fields.filter(
    (field) => !(field.kind === "textarea" && field.shared),
  );
}
