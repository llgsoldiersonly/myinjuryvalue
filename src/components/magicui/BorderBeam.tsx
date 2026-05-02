import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

// A glowing point that traces the border of the parent container (which must
// be `relative`). Pure CSS via offset-path on a circle inside a masked frame.
export function BorderBeam({
  className,
  size = 200,
  duration = 12,
  delay = 0,
  colorFrom = "#1E5BFF",
  colorTo = "#FFD60A",
}: {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  const style = {
    "--size": `${size}px`,
    "--duration": duration,
    "--delay": `-${delay}s`,
    "--color-from": colorFrom,
    "--color-to": colorTo,
  } as CSSProperties;
  return (
    <div
      style={style}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:1px_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect]",
        "[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[var(--size)]",
        "after:animate-border-beam after:[animation-delay:var(--delay)]",
        "after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]",
        "after:[offset-anchor:90%_50%] after:[offset-path:rect(0_auto_auto_0_round_var(--size))]",
        className
      )}
    />
  );
}
