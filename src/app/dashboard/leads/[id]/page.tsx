import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { formatUsd } from "@/lib/scoring";
import { buildOpener } from "@/lib/opener";
import { QualityPill } from "@/components/dashboard/QualityPill";
import { LeadActions } from "@/components/dashboard/LeadActions";
import type { LeadRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const sb = supabaseAdmin();
  const [{ data: lead }, { data: notes }, { data: calls }] = await Promise.all([
    sb.from("case_calculator_leads").select("*").eq("id", params.id).maybeSingle(),
    sb.from("lead_notes").select("*").eq("lead_id", params.id).order("created_at", { ascending: false }),
    sb.from("call_attempts").select("*").eq("lead_id", params.id).order("created_at", { ascending: false }),
  ]);

  if (!lead) notFound();
  const l = lead as LeadRow;
  const opener = buildOpener(l, "<your name>");

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            {l.first_name} {l.last_name}
          </h1>
          <p className="text-slate-400 text-sm">
            Created {new Date(l.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QualityPill quality={l.lead_quality} />
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            score {l.score}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {l.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card title="Contact">
          <Row k="Phone" v={l.phone} />
          <Row k="Email" v={l.email} />
          <Row k="State" v={l.state} />
        </Card>
        <Card title="Estimate">
          <p className="text-2xl font-extrabold text-white">
            {formatUsd(l.value_min)} – {formatUsd(l.value_max)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Quality: {l.lead_quality} · Score: {l.score}</p>
        </Card>
        <Card title="Tracking">
          <Row k="Source" v={l.source} />
          <Row k="UTM source" v={l.utm_source} />
          <Row k="UTM campaign" v={l.utm_campaign} />
          <Row k="fbclid" v={l.fbclid} />
        </Card>
      </div>

      <Card title="Case summary" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <Row k="Accident type" v={l.accident_type} />
          <Row k="When" v={l.accident_timing} />
          <Row k="Injury" v={l.injury_level} />
          <Row k="Vehicle damage" v={l.vehicle_damage_gate} />
          <Row k="Treatment" v={l.medical_treatment} />
          <Row k="Hospital admitted" v={l.hospital_admitted} />
          <Row k="Planned treatment" v={l.planned_treatment} />
          <Row k="No-treatment reason" v={l.no_treatment_reason} />
          <Row k="Still in pain" v={l.still_in_pain} />
          <Row k="Fault" v={l.fault} />
          <Row k="Other driver ticketed" v={l.ticket} />
          <Row k="Police came" v={l.police_scene} />
          <Row k="Police report" v={l.police_report} />
          <Row k="Reason no police" v={l.no_police_reason} />
          <Row k="Other driver insured" v={l.other_driver_insured} />
          <Row k="Spoken to insurance" v={l.insurance_spoken} />
          <Row k="Insurance offer" v={l.insurance_offer} />
          <Row k="Offer amount" v={l.offer_amount} />
          <Row k="Work impact" v={l.work_impact} />
          <Row k="Work loss" v={l.work_loss_details} />
          <Row k="Signed anything" v={l.signed_anything} />
          <Row k="Has attorney" v={l.has_attorney} />
          <Row k="Switching attorney" v={l.switching_attorney} />
          <Row k="Hit and run details" v={l.hit_and_run_details} />
          <Row k="Rideshare status" v={l.rideshare_status} />
        </div>
        {l.incident_description && (
          <div className="mt-3 text-slate-300 text-sm whitespace-pre-wrap bg-white/[0.03] p-3 rounded-lg border border-white/5">
            {l.incident_description}
          </div>
        )}
      </Card>

      <Card title="Intake opener script" className="mt-4">
        <pre className="whitespace-pre-wrap text-slate-200 text-sm">{opener}</pre>
      </Card>

      <LeadActions leadId={l.id} status={l.status} />

      <Card title="Notes" className="mt-4">
        <NotesList notes={notes ?? []} />
      </Card>

      <Card title="Activity log" className="mt-4">
        <Activity calls={calls ?? []} createdAt={l.created_at} />
      </Card>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0F1626] border border-white/5 rounded-2xl p-5 ${className}`}>
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number | null | undefined }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0 gap-4">
      <span className="text-slate-400">{k}</span>
      <span className="text-slate-200 text-right">{v || "—"}</span>
    </div>
  );
}

function NotesList({ notes }: { notes: { id: string; rep_name: string; note: string; created_at: string }[] }) {
  if (!notes.length) return <p className="text-sm text-slate-500">No notes yet.</p>;
  return (
    <ul className="space-y-3">
      {notes.map((n) => (
        <li key={n.id} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{n.rep_name || "rep"}</span>
            <span>{new Date(n.created_at).toLocaleString()}</span>
          </div>
          <p className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">{n.note}</p>
        </li>
      ))}
    </ul>
  );
}

interface CallRow {
  id: string;
  created_at: string;
  status: string | null;
  intake_rep_phone: string | null;
  duration_seconds: number | null;
  failure_reason: string | null;
}

function Activity({ calls, createdAt }: { calls: CallRow[]; createdAt: string }) {
  const items: { ts: string; text: string }[] = [];
  items.push({ ts: createdAt, text: "Lead created" });
  for (const c of calls) {
    items.push({
      ts: c.created_at,
      text: `${c.status ?? "call"} (rep ${c.intake_rep_phone ?? "?"}${c.duration_seconds ? `, ${c.duration_seconds}s` : ""})${c.failure_reason ? ` — ${c.failure_reason}` : ""}`,
    });
  }
  items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  return (
    <ul className="space-y-2 text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-slate-300">
          <span className="text-slate-500 w-44 shrink-0">{new Date(it.ts).toLocaleString()}</span>
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}
