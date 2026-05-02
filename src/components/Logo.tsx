import Image from "next/image";

type Size = "sm" | "md" | "lg" | "xl";

// Responsive height classes — taller on desktop, smaller on mobile.
const HEIGHT_CLASS: Record<Size, string> = {
  sm: "h-8 md:h-10",       // 32 / 40
  md: "h-12 md:h-16",      // 48 / 64
  lg: "h-16 md:h-24",      // 64 / 96
  xl: "h-20 md:h-32",      // 80 / 128
};

const LOGO_SRC = "/IMG_8796.png";

export function Logo({
  size = "md",
  className = "",
}: {
  size?: Size;
  className?: string;
  /** kept for backward compat — ignored */
  withMark?: boolean;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="MyInjuryValue.com"
      // Intrinsic dims for next/image — actual rendered size is set via Tailwind classes.
      // The asset is wider than tall (calculator + wordmark), so use a ~3:1 ratio.
      height={300}
      width={900}
      priority={size === "lg" || size === "xl"}
      className={`w-auto object-contain ${HEIGHT_CLASS[size]} ${className}`}
    />
  );
}

export function Tagline({ className = "" }: { className?: string }) {
  return (
    <p className={`leading-snug ${className}`}>
      <span className="text-brand-navy font-bold">
        The Insurance company doesn&apos;t care about you.
      </span>{" "}
      <span className="text-brand-blue font-bold">
        Find out what you should be paid.
      </span>
    </p>
  );
}
