import { cn } from "@/lib/utils";
import { useId } from "react";

// Subtle SVG dot pattern background. Place inside a relative container.
export function DotPattern({
  className,
  width = 24,
  height = 24,
  cx = 1,
  cy = 1,
  cr = 1,
}: {
  className?: string;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  cr?: number;
}) {
  const id = useId();
  return (
    <svg
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-slate-300/60",
        className
      )}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
