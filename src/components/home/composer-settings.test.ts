import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  parseSettings,
  settingsToParams,
} from "@/components/home/composer-settings";

describe("parseSettings", () => {
  it("round-trips its own output", () => {
    const settings = {
      model: "Seedance",
      durationSeconds: 13,
      aspectRatio: "8:16",
    } as const;
    expect(parseSettings(settingsToParams(settings))).toEqual(settings);
  });

  it("falls back on anything unrecognised", () => {
    expect(parseSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ model: "GPT-9", aspect: "1:1", duration: "abc" })).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it("clamps a duration outside the slider's range", () => {
    expect(parseSettings({ duration: "999" }).durationSeconds).toBe(15);
    expect(parseSettings({ duration: "-4" }).durationSeconds).toBe(5);
  });

  it("keeps valid fields when a sibling is junk", () => {
    const parsed = parseSettings({ model: "Hunyuan", aspect: "nope" });
    expect(parsed.model).toBe("Hunyuan");
    expect(parsed.aspectRatio).toBe(DEFAULT_SETTINGS.aspectRatio);
  });
});
