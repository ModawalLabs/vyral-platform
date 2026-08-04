import { BEATS, type Asset, type Beat, type Scene } from "@/types/session";

let assetCounter = 0;
const nextAssetId = () => `as_${(assetCounter += 1)}`;

/** Placeholder art a generation resolves to. Already in the repo. */
const PLACEHOLDERS = [
  "/assets/inspiration/cosmic-journey.webp",
  "/assets/inspiration/music-video.webp",
  "/assets/inspiration/product-launch.webp",
  "/assets/inspiration/social-ad.webp",
  "/assets/inspiration/wedding-film.webp",
];

export const placeholderFor = (index: number) =>
  PLACEHOLDERS[index % PLACEHOLDERS.length];

export function initialAssets(): Asset[] {
  const slots: Array<Omit<Asset, "id" | "status">> = [
    {
      kind: "characters",
      label: "Courier",
      sceneBeats: ["Hook", "Problem", "Lifestyle"],
    },
    { kind: "characters", label: "Passer-by", sceneBeats: ["Lifestyle"] },
    { kind: "environments", label: "Neon alley", sceneBeats: ["Hook", "Problem"] },
    { kind: "environments", label: "Boulevard", sceneBeats: ["Lifestyle"] },
    { kind: "products", label: "Device, hero angle", sceneBeats: ["Solution"] },
    { kind: "products", label: "Device, in hand", sceneBeats: ["Solution"] },
    { kind: "brand", label: "Wordmark", sceneBeats: ["CTA"] },
    { kind: "brand", label: "Type lockup", sceneBeats: ["CTA"] },
  ];

  return slots.map((slot) => ({ ...slot, id: nextAssetId(), status: "empty" }));
}

export type BeatCoverage = {
  beat: Beat;
  required: number;
  ready: number;
  missing: string[];
};

/**
 * Which beats have everything they need.
 *
 * Reported, never enforced: a gap surfaces as a warning on Generate rather than
 * disabling it.
 */
export function coverageByBeat(assets: Asset[], scenes: Scene[]): BeatCoverage[] {
  const beats = scenes.length ? scenes.map((scene) => scene.beat) : [...BEATS];

  return beats.map((beat) => {
    const required = assets.filter((asset) => asset.sceneBeats.includes(beat));
    const missing = required.filter((asset) => asset.status !== "ready");
    return {
      beat,
      required: required.length,
      ready: required.length - missing.length,
      missing: missing.map((asset) => asset.label),
    };
  });
}

export const missingAssetCount = (assets: Asset[]) =>
  assets.filter((asset) => asset.status !== "ready").length;
