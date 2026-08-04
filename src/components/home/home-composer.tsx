"use client";

import { useRouter } from "next/navigation";

import { settingsToParams } from "@/components/home/composer-settings";
import { PromptComposer } from "@/components/home/prompt-composer";
import { routes } from "@/config/routes";

/**
 * The home page's composer.
 *
 * Generate hands the session to `/new` through the URL rather than any shared
 * store: it survives a reload, it can be linked, and it is the same shape the
 * generation API will take. `/new` re-parses it and starts there.
 */
export function HomeComposer() {
  const router = useRouter();

  return (
    <PromptComposer
      onGenerate={(prompt, settings) => {
        const params = new URLSearchParams({
          prompt,
          ...settingsToParams(settings),
        });
        router.push(`${routes.newVideo}?${params}`);
      }}
    />
  );
}
