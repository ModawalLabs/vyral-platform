"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type ComposerContextValue = {
  prompt: string;
  setPrompt: (value: string) => void;
  /** Load a suggested prompt into the composer and focus it for editing. */
  applyPrompt: (value: string) => void;
  /**
   * True if the focus event being handled came from `applyPrompt` rather than
   * the user. Reading it clears it, so it can only be claimed once.
   */
  consumeAutofillFocus: () => boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

const ComposerContext = createContext<ComposerContextValue | null>(null);

/**
 * Shares the composer's draft between the input and the suggestion rails below
 * it. A context rather than prop drilling because the cards sit in sibling
 * sections — and the page itself stays a server component either way.
 */
export function ComposerProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const autofillFocus = useRef(false);

  const applyPrompt = useCallback((value: string) => {
    setPrompt(value);
    const input = inputRef.current;
    if (!input) return;

    // Flags the focus below as programmatic. The composer collapses its glass
    // inset when the user settles in to type; being handed a prompt is not
    // that, and collapsing on it looked like the frame had broken.
    autofillFocus.current = true;
    input.focus();

    requestAnimationFrame(() => {
      // Park the caret at the end so typing continues the prompt rather than
      // overwriting it — focus() alone would leave it at index 0.
      input.setSelectionRange(value.length, value.length);
      /*
       * `nearest`, never `center`.
       *
       * `center` re-centres even when the composer is already fully visible,
       * and that short smooth scroll left the frame's backdrop-filtered layer
       * misaligned with its own content in Chromium: the inner panel painted
       * flush to the top edge with the whole 10px inset pooled at the bottom.
       * `nearest` is a no-op when the field is already in view, and scrolls
       * cleanly when it genuinely is not.
       */
      input.scrollIntoView({ behavior: "smooth", block: "nearest" });
      // Belt and braces: if the field already had focus no focus event fires,
      // so nothing would have consumed the flag.
      autofillFocus.current = false;
    });
  }, []);

  const consumeAutofillFocus = useCallback(() => {
    const wasAutofill = autofillFocus.current;
    autofillFocus.current = false;
    return wasAutofill;
  }, []);

  const value = useMemo(
    () => ({ prompt, setPrompt, applyPrompt, consumeAutofillFocus, inputRef }),
    [prompt, applyPrompt, consumeAutofillFocus],
  );

  return <ComposerContext.Provider value={value}>{children}</ComposerContext.Provider>;
}

export function useComposer() {
  const context = useContext(ComposerContext);
  if (!context) {
    throw new Error("useComposer must be used inside <ComposerProvider>.");
  }
  return context;
}
