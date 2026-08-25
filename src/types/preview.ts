/**
 * What the preview dialog needs, whatever opened it.
 *
 * Three surfaces feed this — an inspiration card on the home page, a project in the
 * library, a template in the grid — and they have almost nothing in common as records:
 * one has uses and no status, one has a status and no category, one is not even a video
 * you own. Rather than a union the dialog has to branch on, each surface maps itself into
 * this shape and the dialog stays a single component with no idea where it was opened
 * from.
 *
 * That is also why `facts` is a list rather than named fields. Model, aspect ratio and
 * resolution are on all three; created date, uses and status are on exactly one each.
 * Named optionals would put four `{x ? … : null}` branches in the dialog for facts it
 * cannot reason about anyway.
 */
export type PreviewFact = {
  label: string;
  value: string;
};

export type PreviewMedia = {
  /** Poster still. Absent while a render is unfinished, or for a template with no art. */
  thumbnailUrl?: string;
  /** Describes the picture. Empty when the dialog's own title already says it. */
  alt: string;
  /**
   * Width divided by height.
   *
   * A number, not one of the app's ratio labels, because the two disagree: the app calls
   * its landscape option `16:8` while the inspiration stills are genuinely 16:9. The
   * frame has to be laid out from what the file actually is or the picture gets cropped,
   * so the label people read lives in `facts` and this drives the geometry.
   */
  ratio: number;
};

export type PreviewAction = {
  label: string;
  /** Runs, then closes the dialog. Omit for an action that is not wired up yet. */
  onClick?: () => void;
  /** Hover text — how the rest of the app admits a control does nothing yet. */
  title?: string;
};

export type PreviewItem = {
  id: string;
  title: string;
  /** Small grouping label above the title: a category, a status, a section. */
  eyebrow?: string;
  media: PreviewMedia;
  prompt: string;
  facts: PreviewFact[];
  /** The one thing you can do with this, here. Differs per surface. */
  action?: PreviewAction;
};
