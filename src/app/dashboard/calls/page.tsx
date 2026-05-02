import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface CallRow {
  id: string;
  created_at: string;
  lead_id: string;
  status: string | null;
  intake_rep_phone: string | null;
  duration_seconds: number | null;
  failure_reason: string | null;
  recording_url: string | null;
  case_calculator_leads: { first_name: string | null; last_name: string | null; phone: string | null } | null;
}

export default async function CallsPage() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("call_attempts")
    .select(
      "id,created_at,lead_id,status,intake_rep_phone,duration_seconds,failure_reason,recording_url,case_calculator_leads(first_name,last_name,phone)"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const calls = (data ?? []) as unknown as CallRow[];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-extrabold">Call history</h1>
      <p className="text-slate-400 text-sm mt-1">Last 500 call attempts.</p>

      {/* Mobile stacked cards */}
      <div className="md:hidden mt-4 space-y-3">
        {calls.map((c) => (
          <div key={c.id} className="bg-[#0F1626] border border-white/5 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/dashboard/leads/${c.lead_id}`}
                className="font-bold text-white hover:text-brand-blueLight"
              >
                {c.case_calculator_leads?.first_name} {c.case_calculator_leads?.last_name}
              </Link>
              <span className="text-xs text-slate-400">{c.status ?? "—"}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{new Date(c.created_at).toLocaleString()}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs">
              <div><span className="text-slate-500">Lead:</span> <span className="text-slate-200">{c.case_calculator_leads?.phone || "—"}</span></div>
              <div><span className="text-slate-500">Rep:</span> <span className="text-slate-200">{c.intake_rep_phone || "—"}</span></div>
              <div><span className="text-slate-500">Duration:</span> <span className="text-slate-200">{c.duration_seconds ? `${c.duration_seconds}s` : "—"}</span></div>
              <div><span className="text-slate-500">Failure:</span> <span className="text-slate-200">{c.failure_reason || "—"}</span></div>
            </div>
            {c.recording_url && <RecordingPlayer url={c.recording_url} />}
          </div>
        ))}
        {calls.length === 0 && (
          <p className="text-center py-10 text-slate-500">No calls yet.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block mt-5 overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1626] text-slate-400">
            <tr className="text-left">
              <th className="px-3 py-3">When</th>
              <th className="px-3 py-3">Lead</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Rep phone</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Duration</th>
              <th className="px-3 py-3">Recording</th>
              <th className="px-3 py-3">Failure</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="border-t border-white/5">
                <td className="px-3 py-3 text-slate-400 whitespace-nowrap">
                  {new Date(c.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <Link href={`/dashboard/leads/${c.lead_id}`} className="text-white hover:text-brand-blueLight font-semibold">
                    {c.case_calculator_leads?.first_name} {c.case_calculator_leads?.last_name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-slate-200">{c.case_calculator_leads?.phone}</td>
                <td className="px-3 py-3 text-slate-200">{c.intake_rep_phone}</td>
                <td className="px-3 py-3 text-slate-200">{c.status}</td>
                <td className="px-3 py-3 text-slate-200">
                  {c.duration_seconds ? `${c.duration_seconds}s` : "—"}
                </td>
                <td className="px-3 py-3">
                  {c.recording_url ? <RecordingPlayer url={c.recording_url} compact /> : <span className="text-slate-500">—</span>}
                </td>
                <td className="px-3 py-3 text-slate-400">{c.failure_reason || "—"}</td>
              </tr>
            ))}
            {calls.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-500">
                  No calls yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecordingPlayer({ url, compact = false }: { url: string; compact?: boolean }) {
  // Twilio recording URLs serve mp3 when you append `.mp3`. Use that for inline <audio>.
  const mp3 = url.endsWith(".mp3") ? url : `${url}.mp3`;
  if (compact) {
    return (
      <a
        href={mp3}
        target="_blank"
        rel="noreferrer"
        className="text-xs px-2 py-1 rounded-md bg-brand-blue/15 text-brand-blueLight border border-brand-blue/30 hover:bg-brand-blue/25"
      >
        ▶ Play
      </a>
    );
  }
  return (
    <div className="mt-3">
      <audio controls preload="none" className="w-full h-9">
        <source src={mp3} type="audio/mpeg" />
      </audio>
    </div>
  );
}
