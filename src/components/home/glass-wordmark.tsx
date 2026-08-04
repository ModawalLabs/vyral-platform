import { cn } from "@/lib/utils";

/**
 * Liquid-glass display type.
 *
 * The word is rendered twice — frosted body and sweeping specular — because no
 * browser can clip `backdrop-filter` to glyphs. Only the body is exposed to
 * assistive tech; the specular is decoration and would otherwise be announced
 * as a repeat.
 *
 * `children` is typed as `string` deliberately: both layers must receive
 * identical content or the copies fall out of register.
 *
 * Styling lives in `globals.css` (`.glass-word*`) — the layered
 * `background-clip: text` and keyframes have no Tailwind equivalent.
 */
export function GlassWordmark({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={cn("glass-word", className)}>
      <span className="glass-word-body">{children}</span>
      <span aria-hidden className="glass-word-shine">
        {children}
      </span>
    </span>
  );
}
