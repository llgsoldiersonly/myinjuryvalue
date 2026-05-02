"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QualityPill, QUALITY_RANK } from "./QualityPill";
import type { LeadQuality, LeadRow } from "@/lib/types";

const QUALITIES: LeadQuality[] = [
  "URGENT_REVIEW",
  "HIGH_VALUE",
  "HOT",
  "GOOD",
  "REVIEW",
  "LOW",
];
const STATUSES = [
  "new", "attempted", "contacted", "qualified", "disqualified", "signed", "sold", "lost",
];

export function LeadQueue({
  leads,
  initialFilters,
}: {
  leads: LeadRow[];
  initialFilters: { q?: string; quality?: string; status?: string; state?: string };
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialFilters.q ?? "");
  const [quality, setQuality] = useState(initialFilters.quality ?? "");
  const [status, setStatus] = useState(initialFilters.status ?? "");
  const [state, setState] = useState(initialFilters.state ?? "");

  const sorted = useMemo(() => {
    return [...leads].sort((a, b) => {
      const ra = QUALITY_RANK[(a.lead_quality as LeadQuality) ?? "LOW"] ?? 99;
      const rb = QUALITY_RANK[(b.lead_quality as LeadQuality) ?? "LOW"] ?? 99;
      if (ra !== rb) return ra - rb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [leads]);

  function applyFilters(next?: Partial<{ q: string; quality: string; status: string; state: string }>) {
    const merged = { q, quality, status, state, ...next };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v as string);
    });
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="mt-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-[#0F1626] p-3 rounded-2xl border border-white/5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Search name, phone, email…"
          className="bg-[#0B1220] border border-white/10 text-sm rounded-lg px-3 py-2 w-full sm:w-72 text-slate-200"
        />
        <select
          value={quality}
          onChange={(e) => { setQuality(e.target.value); applyFilters({ quality: e.target.value }); }}
          className="bg-[#0B1220] border border-white/10 text-sm rounded-lg px-3 py-2 text-slate-200"
        >
          <option value="">All qualities</option>
          {QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
          className="bg-[#0B1220] border border-white/10 text-sm rounded-lg px-3 py-2 text-slate-200"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          value={state}
          onChange={(e) => setState(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="State"
          className="bg-[#0B1220] border border-white/10 text-sm rounded-lg px-3 py-2 w-32 text-slate-200"
        />
        <button
          onClick={() => applyFilters()}
          className="text-sm bg-brand-blue text-white font-semibold px-3 py-2 rounded-lg"
        >
          Apply
        </button>
        <button
          onClick={() => { setQ(""); setQuality(""); setStatus(""); setState(""); router.push("/dashboard"); }}
          className="text-sm text-slate-400 hover:text-white"
        >
          Reset
        </button>
        <span className="ml-auto text-xs text-slate-500">{sorted.length} leads</span>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden mt-4 space-y-3">
        {sorted.map((l) => (
          <div key={l.id} className="bg-[#0F1626] border border-white/5 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/dashboard/leads/${l.id}`}
                className="font-bold text-white hover:text-brand-blueLight"
              >
                {l.first_name} {l.last_name}
              </Link>
              <QualityPill quality={l.lead_quality} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(l.created_at).toLocaleString()} · {l.state}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-xs">
              <div><span className="text-slate-500">Phone:</span> <span className="text-slate-200">{l.phone}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className="text-slate-200">{l.status}</span></div>
              <div className="col-span-2 truncate"><span className="text-slate-500">Accident:</span> <span className="text-slate-200">{l.accident_type}</span></div>
              <div className="col-span-2 truncate"><span className="text-slate-500">Injury:</span> <span className="text-slate-200">{l.injury_level}</span></div>
              <div className="col-span-2 truncate"><span className="text-slate-500">Treatment:</span> <span className="text-slate-200">{l.medical_treatment}</span></div>
              <div><span className="text-slate-500">Fault:</span> <span className="text-slate-200">{l.fault}</span></div>
              <div><span className="text-slate-500">Offer:</span> <span className="text-slate-200">{l.offer_amount || "—"}</span></div>
            </div>
            <div className="flex gap-2 mt-3">
              <ActionButton onClick={() => callLead(l.id)}>📞 Call</ActionButton>
              <ActionButton onClick={() => smsLead(l.id)}>SMS</ActionButton>
              <Link
                href={`/dashboard/leads/${l.id}`}
                className="text-xs px-2 py-1 rounded-md border border-white/10 text-slate-300 hover:bg-white/5"
              >
                Details →
              </Link>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-center py-10 text-slate-500">No leads match these filters.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block mt-4 overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1626] text-slate-400">
            <tr className="text-left">
              <Th>Created</Th>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>State</Th>
              <Th>Accident</Th>
              <Th>Injury</Th>
              <Th>Treatment</Th>
              <Th>Fault</Th>
              <Th>Offer</Th>
              <Th>Attorney</Th>
              <Th>Quality</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => (
              <tr key={l.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <Td className="text-slate-400 whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString()}
                </Td>
                <Td className="font-semibold text-white">
                  <Link href={`/dashboard/leads/${l.id}`} className="hover:text-brand-blueLight">
                    {l.first_name} {l.last_name}
                  </Link>
                </Td>
                <Td>{l.phone}</Td>
                <Td>{l.state}</Td>
                <Td className="max-w-[160px] truncate">{l.accident_type}</Td>
                <Td className="max-w-[160px] truncate">{l.injury_level}</Td>
                <Td className="max-w-[180px] truncate">{l.medical_treatment}</Td>
                <Td>{l.fault}</Td>
                <Td>{l.offer_amount || "-"}</Td>
                <Td className="max-w-[160px] truncate">{l.has_attorney}</Td>
                <Td><QualityPill quality={l.lead_quality} /></Td>
                <Td>{l.status}</Td>
                <Td>
                  <div className="flex gap-2">
                    <ActionButton onClick={() => callLead(l.id)}>Call</ActionButton>
                    <ActionButton onClick={() => smsLead(l.id)}>SMS</ActionButton>
                    <Link
                      href={`/dashboard/leads/${l.id}`}
                      className="text-xs px-2 py-1 rounded-md border border-white/10 text-slate-300 hover:bg-white/5"
                    >
                      Details
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center py-10 text-slate-500">
                  No leads match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function callLead(id: string) {
  const res = await fetch("/api/dashboard/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead_id: id }),
  });
  if (!res.ok) alert(`Failed to start call: ${await res.text()}`);
  else alert("Calling intake rep — accept and we'll connect you.");
}

async function smsLead(id: string) {
  const body = window.prompt("SMS message to lead:");
  if (!body) return;
  const res = await fetch("/api/dashboard/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead_id: id, body }),
  });
  if (!res.ok) alert(`Failed to send SMS: ${await res.text()}`);
  else alert("SMS sent.");
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wider">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 text-slate-200 align-top ${className}`}>{children}</td>;
}

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2 py-1 rounded-md bg-brand-blue/15 text-brand-blueLight border border-brand-blue/30 hover:bg-brand-blue/25"
    >
      {children}
    </button>
  );
}
