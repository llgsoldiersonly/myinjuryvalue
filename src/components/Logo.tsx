// Web-native adaptation of the MyInjuryValue.com logo mockup.
// Two-tone wordmark: navy "My" + "Value", blue "Injury", gray ".com",
// with a calculator/$ glyph as a compact mark.
type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, { wrap: string; text: string; mark: number }> = {
  sm: { wrap: "gap-2", text: "text-xl", mark: 22 },
  md: { wrap: "gap-3", text: "text-2xl md:text-3xl", mark: 30 },
  lg: { wrap: "gap-3", text: "text-3xl md:text-4xl", mark: 40 },
  xl: { wrap: "gap-4", text: "text-4xl md:text-5xl", mark: 52 },
};

export function CalculatorMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="calcBody" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5B6577" />
          <stop offset="1" stopColor="#2F3848" />
        </linearGradient>
      </defs>
      <rect x="6" y="4" width="52" height="56" rx="8" fill="url(#calcBody)" />
      <rect x="12" y="10" width="40" height="18" rx="4" fill="#1E5BFF" />
      <text
        x="32" y="25" textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800" fontSize="16" fill="#fff"
      >$</text>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={14 + c * 12}
            y={34 + r * 8}
            width={8}
            height={5}
            rx={1.5}
            fill={r === 2 && c === 2 ? "#1E5BFF" : "#1F2937"}
          />
        ))
      )}
    </svg>
  );
}

export function Logo({ size = "md", withMark = true }: { size?: Size; withMark?: boolean }) {
  const s = SIZE[size];
  return (
    <div className={`flex items-center ${s.wrap}`}>
      {withMark && <CalculatorMark size={s.mark} />}
      <span className={`font-extrabold tracking-tight ${s.text} text-brand-navy`}>
        My<span className="text-brand-blue">Injury</span>Value
        <span className="text-slate-400 font-bold">.com</span>
      </span>
    </div>
  );
}

export function Tagline({ className = "" }: { className?: string }) {
  return (
    <p className={`leading-snug ${className}`}>
      <span className="text-brand-navy font-bold">
        The insurance company doesn&apos;t care about you.
      </span>{" "}
      <span className="text-brand-blue font-bold">
        Find out what you should be paid.
      </span>
    </p>
  );
}
