import Image from "next/image";

import { placeholderFor } from "@/lib/session/assets";

/**
 * Asset Library.
 *
 * Four square stills, and nothing else — no headings, no captions, no actions. The tab
 * label already names the panel, and a caption under an image that stands for nothing
 * in particular would only be describing a placeholder.
 *
 * The art comes from `placeholderFor`, the same helper the scene media and the render
 * queue draw on, so the whole app resolves its stand-in imagery through one place.
 *
 * The session still holds the state this will need — `assets`, `generateAsset`,
 * `uploadAsset`, `reuseAsset` — currently with no caller. See the README.
 */
export function AssetsTab() {
  return (
    // `@container`, not viewport breakpoints: this panel is a fraction of the window,
    // so a `sm:`/`md:` step fires while the column is still too narrow to hold four
    // squares — the same mistake the settings tiles and the export grid both made.
    <div className="@container pt-2">
      <div className="grid grid-cols-2 gap-4 @min-[30rem]:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          // `group` on the tile so the image can respond to hover over the whole
          // square rather than only where the bitmap happens to be.
          <div
            key={index}
            data-slot="asset-card"
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted/30 ring-1 ring-foreground/10 ring-inset"
          >
            <Image
              src={placeholderFor(index)}
              // Decorative: these stand in for a library that does not exist yet, so
              // there is nothing truthful to describe. A made-up description would be
              // worse than none.
              alt=""
              fill
              // Four across at the widest, inside a column that is itself a fraction of
              // the window — so a quarter of that, and full width once it drops to two.
              sizes="(min-width: 1024px) 12vw, 40vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
