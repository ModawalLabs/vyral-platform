"use client";

import { useEffect, useState } from "react";

const POSTER = "/assets/login/dancer-poster.webp";

/**
 * Geometry, derived from the 1600×900 reference rather than guessed.
 *
 * At 1600×900 the viewport's aspect is exactly the video's (16:9), so the frame maps onto
 * the screen 1:1 and the card lands at a measurable place inside it: 32..704 across and
 * 68..833 down — 42% of the frame's width and 85% of its height. Invert that and the frame
 * must be `100 / 42` of the card's width, which is where `FRAME_WIDTH` comes from.
 *
 * `OFFSET_X` starts from that reference and then goes further. At the measured 2% the
 * dancer sat at 71% of the card, far enough right that the trailing edge of her dress fell
 * outside the frame; at 5% she sits at 64% and more of her is inside it. It also buys room
 * for the left fade below, which cannot begin until the card's edge is clear of it.
 *
 * The offsets are `translate`, not `left`/`top`, because a percentage on `translate`
 * resolves against the element's *own* size. A percentage on `top` would resolve against
 * the container's height, which is the wrong basis and was the trap here: the frame's
 * height is derived from its width via `aspect-ratio`, so only a self-relative offset can
 * express "5% of my own width" without knowing either number.
 */
const FRAME_WIDTH = `${(100 / 42) * 100}%`; // 238.095% of the card's width
const OFFSET_X = "-5%"; // of the frame's own width
/**
 * The card's top edge sat 68px into a 900px frame at the reference — 7.5556% of it.
 *
 * Anchoring the frame's top to that figure rather than centring it on the card is what
 * keeps her head in shot now the card is shorter. Centred, a 68vh card showed the middle
 * 68% of the frame and cut the top of her head off; anchored, the card's top is always
 * 7.5556% into the frame, so the gap above her head is identical at every size and the
 * shorter card simply crops the trailing hem instead.
 */
const OFFSET_Y = "-7.5556%"; // of the frame's own height
const REFERENCE_ASPECT = "1920 / 1080";

/**
 * Feathering, in the frame's own coordinates.
 *
 * Every stop is bounded by the card's edges: the fade has to finish before the card
 * begins, or it dims the dancer at the one place she is meant to be at full strength.
 *
 * With `OFFSET_X` at 5% the card's left edge now sits at 5% of the frame rather than 2%,
 * so the left fade has room to run to 4.5% — more than twice its old reach, and long
 * enough that the frame's left edge dissolves into the page instead of ending on a line.
 * The top still has to stop short of 7.56%. Right and bottom have the whole run past 44%
 * and 92.6%, so they get a long, soft ramp — that is the edge the particles trail off
 * into.
 */
const EDGE_FADE = [
  "linear-gradient(to right, transparent 0%, black 4.5%, black 86%, transparent 100%)",
  "linear-gradient(to bottom, transparent 0%, black 6.4%, black 94%, transparent 100%)",
].join(", ");

/**
 * The dancer behind the sign-in screen.
 *
 * Positioned against the *card*, not the viewport. Covering the viewport made the
 * composition a function of the window's aspect ratio — `object-cover` crops
 * symmetrically, so a taller window pushed her sideways relative to the frame she is
 * supposed to be standing in. Sized from the card instead, her horizontal placement is
 * identical at every width and height.
 *
 * Vertically it hangs from the card's top by `OFFSET_Y`, so the space above her head is
 * the same at every size. The frame is 9/16 of its own width — about 900px whenever the
 * card is at its full 42rem — which covers a 68vh card on any window up to roughly
 * 1224px tall. Past that a band is left at the bottom; the wrapper's dark fill matches
 * the video's own near-black backdrop and the bottom fade blurs the join, so it reads as
 * the frame receding rather than as a gap.
 *
 * Three other things this component exists to get right:
 *
 * 1. **It must not load on a phone.** The video is hidden below `lg` by design, and a
 *    `<video>` behind `display: none` is still fetched by most browsers. So it is mounted
 *    from an effect behind a `matchMedia` check rather than rendered and hidden.
 *
 * 2. **Resolution follows the screen.** `<source media="…">` was dropped from the spec
 *    and is ignored by current browsers, so the only reliable way to pick an encode is
 *    here: 1920 above 1600px, 1280 below it.
 *
 * 3. **Reduced motion means no motion.** A looping background is exactly what that
 *    setting is for, so it gets the poster frame instead.
 *
 * The asset is pre-flipped at encode time. In the original the dancer stands right of
 * centre with the dress and particles streaming left; mirrored, she lands in the frame on
 * the left of the page and the particles carry right across the form.
 */
export function LoginVideo() {
  /** `null` until the effect decides, which is also what keeps the server render empty. */
  const [mode, setMode] = useState<"video" | "poster" | null>(null);
  const [src, setSrc] = useState(POSTER);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const decide = () => {
      if (!wide.matches) {
        setMode(null);
        return;
      }
      setMode(still.matches ? "poster" : "video");
      setSrc(
        window.matchMedia("(min-width: 1600px)").matches
          ? "/assets/login/dancer-1920.mp4"
          : "/assets/login/dancer-1280.mp4",
      );
    };

    decide();
    // Rotating a tablet or dragging a window between monitors both cross these lines.
    wide.addEventListener("change", decide);
    still.addEventListener("change", decide);
    return () => {
      wide.removeEventListener("change", decide);
      still.removeEventListener("change", decide);
    };
  }, []);

  if (mode === null) return null;

  const className =
    "pointer-events-none absolute top-0 left-0 h-auto max-w-none opacity-0 transition-opacity duration-1000 ease-out motion-reduce:transition-none";

  const style: React.CSSProperties = {
    width: FRAME_WIDTH,
    aspectRatio: REFERENCE_ASPECT,
    // Both offsets are self-relative percentages — see the note on `OFFSET_X`.
    transform: `translate(${OFFSET_X}, ${OFFSET_Y})`,
    maskImage: EDGE_FADE,
    WebkitMaskImage: EDGE_FADE,
    // Both gradients have to apply at once. Without `intersect` the second replaces the
    // first and only the vertical fade survives.
    //
    // Standard property only. Setting `WebkitMaskComposite` alongside it looked safer but
    // was worse: browsers alias the two, so whichever is written last wins — the old
    // `-webkit-` keyword vocabulary was overriding the standard one, and a browser that
    // honoured only the standard property would have been handed a keyword it does not
    // know. `-webkit-mask-image` above is kept because that one is a genuine fallback.
    maskComposite: "intersect",
  };

  if (mode === "poster") {
    return (
      // Plain `<img>`, not `next/image`: the size is set in CSS from the card, so there is
      // no responsive srcset to generate and the optimiser would only add a hop.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={POSTER}
        alt=""
        aria-hidden
        style={style}
        onLoad={(event) => event.currentTarget.classList.remove("opacity-0")}
        className={className}
      />
    );
  }

  return (
    <video
      // `autoPlay muted loop playsInline` is the full set a background video needs:
      // without `muted` autoplay is blocked, and without `playsInline` iOS takes it
      // fullscreen the moment it starts.
      autoPlay
      muted
      loop
      playsInline
      poster={POSTER}
      aria-hidden
      style={style}
      // Fades in on the first frame rather than cutting in, so the page does not flash
      // from black to lit.
      onPlaying={(event) => event.currentTarget.classList.remove("opacity-0")}
      className={className}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
