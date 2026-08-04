import type { SessionSettings } from "@/types/session";

/**
 * The session's output shape as a Tailwind aspect class.
 *
 * Shared because more than one surface draws a frame in the shape of the finished
 * video — the screenplay's media tiles and the test screening's previews — and two
 * copies of this map would eventually disagree.
 *
 * Paired with a definite height it also works in reverse: `aspect-[2/1] h-full`
 * derives the width from the height, which is how a portrait preview stays inside a
 * fixed-height card instead of growing to twice the card's width.
 */
export const ASPECT_CLASS: Record<SessionSettings["aspectRatio"], string> = {
  "16:8": "aspect-[2/1]",
  "8:16": "aspect-[1/2]",
};
