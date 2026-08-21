"use client";

import { ArrowRight } from "lucide-react";

import { useSession } from "@/components/create/session-provider";
import { BrandButton } from "@/components/ui/brand-button";

/**
 * The answer to whatever the director just asked.
 *
 * One button, because each intake question states the call the director has made and
 * asks to confirm it — so there is exactly one thing to say back. It renders at the
 * foot of the conversation rather than inside a message, since it belongs to the
 * current question rather than to the transcript.
 *
 * Absent while the director is typing: a Proceed button under a question that has not
 * finished arriving invites answering something you have not read.
 */
export function IntakeProceed() {
  const { intakeStep, intakeTyping, intakeQuestionCount, proceedIntake } = useSession();

  if (intakeTyping || intakeStep >= intakeQuestionCount) return null;

  return (
    <div data-slot="intake-proceed" className="flex justify-start pt-1">
      <BrandButton onClick={proceedIntake} className="h-9">
        Proceed
        <ArrowRight aria-hidden className="size-4" />
      </BrandButton>
    </div>
  );
}
