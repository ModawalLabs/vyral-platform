"use client";

import { IntakeStage } from "@/components/create/intake-stage";
import { useSession } from "@/components/create/session-provider";
import { WorkspacePanel } from "@/components/create/workspace-panel";

/**
 * The right half of a running session.
 *
 * The slate until the director's intake is answered, then the workspace. A separate
 * component because `CreateSession` renders the provider and so cannot read from it —
 * same reason `DirectorColumn` exists on the other side.
 *
 * An unmount rather than a hidden panel: `Tabs` would otherwise be mounted and
 * focusable behind the slate, and a keyboard user could tab into a workspace that is
 * not supposed to exist yet.
 */
export function WorkspaceSide() {
  const { intakeComplete } = useSession();
  return intakeComplete ? <WorkspacePanel /> : <IntakeStage />;
}
