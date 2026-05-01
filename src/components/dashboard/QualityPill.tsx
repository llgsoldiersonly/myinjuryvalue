import type { LeadQuality } from "@/lib/types";

const STYLES: Record<LeadQuality, string> = {
  HIGH_VALUE: "bg-green-500/15 text-green-400 border-green-500/30",
  HOT: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  GOOD: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  REVIEW: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  LOW: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  URGENT_REVIEW: "bg-red-500/20 text-red-300 border-red-500/40",
};

export function QualityPill({ quality }: { quality: LeadQuality | string | null | undefined }) {
  const q = (quality ?? "LOW") as LeadQuality;
  return (
    <span
      className={`inline-flex text-[11px] font-bold tracking-wide uppercase border px-2 py-0.5 rounded-full ${STYLES[q] ?? STYLES.LOW}`}
    >
      {q.replace("_", " ")}
    </span>
  );
}

export const QUALITY_RANK: Record<LeadQuality, number> = {
  URGENT_REVIEW: 1,
  HIGH_VALUE: 2,
  HOT: 3,
  GOOD: 4,
  REVIEW: 5,
  LOW: 6,
};
