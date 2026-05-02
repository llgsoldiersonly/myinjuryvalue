import { cn } from "@/lib/utils";

export function AnimatedGradientText({
  children,
  className,
  from = "from-brand-blue",
  via = "via-brand-blueLight",
  to = "to-brand-navy",
}: {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block bg-clip-text text-transparent bg-gradient-to-r",
        "bg-[length:200%_auto] animate-gradient-x",
        from,
        via,
        to,
        className
      )}
    >
      {children}
    </span>
  );
}
