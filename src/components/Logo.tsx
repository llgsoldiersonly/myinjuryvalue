import Image from "next/image";

type Size = "sm" | "md" | "lg" | "xl";

const HEIGHT: Record<Size, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

// The actual logo asset. Drop the file at `public/IMG_8796.png`.
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
  const h = HEIGHT[size];
  return (
    <Image
      src={LOGO_SRC}
      alt="MyInjuryValue.com"
      height={h}
      // wide aspect ratio to fit "calculator + car + wordmark" mockup
      width={h * 3}
      priority={size === "lg" || size === "xl"}
      className={`h-auto w-auto object-contain ${className}`}
      style={{ maxHeight: h }}
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
