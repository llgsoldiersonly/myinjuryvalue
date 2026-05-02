import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

export function Marquee({
  children,
  className,
  pauseOnHover = true,
  speed = 40,
  repeat = 4,
  gap = "1rem",
}: {
  children: React.ReactNode;
  className?: string;
  pauseOnHover?: boolean;
  speed?: number;
  repeat?: number;
  gap?: string;
}) {
  const style = {
    "--duration": `${speed}s`,
    "--gap": gap,
  } as CSSProperties;

  return (
    <div
      style={style}
      className={cn(
        "group flex overflow-hidden p-2 [gap:var(--gap)]",
        className
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 justify-around [gap:var(--gap)] animate-marquee",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
