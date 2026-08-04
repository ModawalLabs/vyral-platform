import type { Metadata } from "next";

import { CreateSession, type Handoff } from "@/components/create/create-session";
import { DismissCreate } from "@/components/create/dismiss-create";
import { ComposerProvider } from "@/components/home/composer-provider";

export const metadata: Metadata = {
  title: "New video",
  // A dead end for crawlers, and it is behind auth anyway.
  robots: { index: false, follow: false },
};

/** A repeated param arrives as an array; take the first and ignore the rest. */
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Full-screen composer, and the session it opens into.
 *
 * Deliberately outside the `(app)` route group: that group's layout renders the
 * sidebar, and this screen is meant to have nothing competing with the prompt.
 *
 * `?prompt=…&model=…&duration=…&aspect=…` hands a session over from the home
 * page. Carrying it in the URL rather than a shared store means it survives a
 * reload and can be linked; the values are untrusted, so `parseSettings`
 * validates them before anything renders.
 *
 * The split after Generate is component state rather than a second route, so
 * the composer can animate across the screen instead of being remounted. Once a
 * session has a real id, this is the seam to promote to `/sessions/[id]`.
 */
export default async function NewVideoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const handoff: Handoff = {
    prompt: first(params.prompt),
    model: first(params.model),
    duration: first(params.duration),
    aspect: first(params.aspect),
  };

  return (
    <ComposerProvider>
      <div className="relative flex min-h-dvh flex-1 flex-col">
        <DismissCreate />
        <CreateSession handoff={handoff} />
      </div>
    </ComposerProvider>
  );
}
