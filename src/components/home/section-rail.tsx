"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** How far the trailing fade reaches once there is content hidden past it. */
const FADE = "3rem";

/**
 * Horizontal card rail with a heading, arrow controls, and a trailing fade.
 *
 * Only the right edge fades — it is the one carrying information ("the row
 * continues"). A matching left fade would dim cards the user has already
 * scrolled past for no benefit, so the leading edge stays crisp.
 */
export function SectionRail({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // ResizeObserver fires once on observe, so this both measures now and keeps
    // up with viewport changes — and it does so in a callback rather than
    // synchronously in the effect body, which would cascade renders.
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const hasOverflow = !atStart || !atEnd;

  return (
    <section className={cn("min-w-0", className)}>
      <header className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {hasOverflow ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {[
              {
                dir: -1 as const,
                label: "Scroll left",
                Icon: ChevronLeft,
                done: atStart,
              },
              { dir: 1 as const, label: "Scroll right", Icon: ChevronRight, done: atEnd },
            ].map(({ dir, label, Icon, done }) => (
              <button
                key={label}
                type="button"
                onClick={() => scrollBy(dir)}
                disabled={done}
                aria-label={label}
                className="grid size-8 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35"
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <div
        ref={scrollerRef}
        onScroll={sync}
        style={{
          maskImage: `linear-gradient(to right, black calc(100% - ${atEnd ? "0px" : FADE}), transparent 100%)`,
        }}
        /*
         * `overflow-x: auto` forces the vertical axis to clip too, and clipping
         * happens at the padding edge — so a card's hover lift and its glow get
         * sliced off. The padding here is that bleed room; the matching negative
         * margins cancel it out, leaving surrounding spacing untouched.
         *
         * Bottom needs the most: the card shadows are offset downward.
         */
        className="-mx-3 -mt-3 -mb-10 no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pt-3 pb-10"
      >
        {children}
      </div>
    </section>
  );
}
