/**
 * Three canned stories.
 *
 * Genuinely different takes rather than reworded ones, so Regenerate visibly
 * produces new text instead of appearing to do nothing.
 */
export const STORY_VARIANTS = [
  "A courier threads a rain-soaked city at night, neon smearing across wet tarmac. \
Halfway across town the phone dies and the route goes with it — the confidence \
drains out of the ride in a single held beat. Then the device wakes in a gloved \
hand, warm light spilling up the sleeve, and the map redraws itself across the \
street ahead. The rider rejoins traffic differently: no hesitation, no checking \
over a shoulder. The city opens up in front of them, and the last frame is a \
wordmark settling over the reflection of a street they now own.",

  "It opens on stillness — a bike propped against a wall, rain ticking off the \
frame, a rider staring at a screen that has given up. The city is loud and \
completely useless to them. One press changes the temperature of the shot: the \
product lights the alley, the route resolves, and the sound comes back in. From \
there the film accelerates with the rider, cutting faster as the streets open, \
until the last frame lands on the logo and holds just long enough to breathe.",

  "Shot almost entirely in reflections. The opening is a puddle — neon, a passing \
wheel, the rider's silhouette breaking the surface. The problem arrives as an \
absence: the glow of a screen goes out and the reflection goes dark with it. The \
solution returns the light, and from that point the reflections multiply — shop \
windows, a visor, the wet boulevard — until the city is carrying the rider \
forward. The wordmark forms out of those reflections and settles.",
] as const;

/** The next variant, never the one already showing. */
export const nextStoryVariant = (current: number) =>
  (current + 1) % STORY_VARIANTS.length;
