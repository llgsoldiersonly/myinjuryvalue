"use client";
import { cn } from "@/lib/utils";
import { CSSProperties, forwardRef } from "react";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerWidth?: number;
  asChild?: boolean;
}

// Shiny button wraps any clickable in a shimmer animation. We render a span
// inside so it works equally well as an <a> when wrapped by next/link.
export const ShinyButton = forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ children, className, shimmerWidth = 100, ...rest }, ref) => {
    const style = { "--shimmer-width": `${shimmerWidth}px` } as CSSProperties;
    return (
      <button
        ref={ref}
        style={style}
        className={cn("group relative inline-flex items-center justify-center", className)}
        {...rest}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-[inherit] pointer-events-none",
            "bg-clip-text bg-no-repeat",
            "[background-position:0_0] [background-size:var(--shimmer-width)_100%]",
            "animate-shiny-shimmer",
            "bg-gradient-to-r from-transparent via-white/40 to-transparent"
          )}
        />
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);
ShinyButton.displayName = "ShinyButton";
