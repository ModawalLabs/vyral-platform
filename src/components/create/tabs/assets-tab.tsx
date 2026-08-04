/**
 * Asset Library — intentionally empty.
 *
 * The previous UI (asset slots grouped by kind, with generate / upload / reuse per
 * slot) was removed to be rebuilt from scratch. Kept as a component rather than
 * deleted so the tab keeps its panel and there is one obvious place to build in.
 *
 * The session still holds the state it will need — `assets`, `generateAsset`,
 * `uploadAsset`, `reuseAsset` — currently with no caller. See the README.
 */
export function AssetsTab() {
  return null;
}
