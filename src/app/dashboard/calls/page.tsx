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
  case_calculator_leads: { first_name: string | null; last_name: string | null; phone: string | null } | null;
}

export default async function CallsPage() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("call_attempts")
    .select(
      "id,created_at,lead_id,status,intake_rep_phone,duration_seconds,failure_reason,case_calculator_leads(first_name,last_name,phone)"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const calls = (data ?? []) as unknown as CallRow[];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold">Call history</h1>
      <p className="text-slate-400 text-sm mt-1">Last 500 call attempts.</p>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1626] text-slate-400">
            <tr className="text-left">
              <th className="px-3 py-3">When</th>
              <th className="px-3 py-3">Lead</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Rep phone</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Duration</th>
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
                <td className="px-3 py-3 text-slate-400">{c.failure_reason || "—"}</td>
              </tr>
            ))}
            {calls.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500">
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
