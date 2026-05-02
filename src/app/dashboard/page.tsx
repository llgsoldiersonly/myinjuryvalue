import { supabaseAdmin } from "@/lib/supabase";
import { LeadQueue } from "@/components/dashboard/LeadQueue";
import type { LeadRow } from "@/lib/types";

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: { q?: string; quality?: string; status?: string; state?: string };
}) {
  const sb = supabaseAdmin();
  let query = sb
    .from("case_calculator_leads")
    .select(
      "id,created_at,first_name,last_name,phone,email,state,accident_type,injury_level,medical_treatment,fault,offer_amount,has_attorney,lead_quality,status,value_min,value_max,score"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (searchParams.quality) query = query.eq("lead_quality", searchParams.quality);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.state) query = query.eq("state", searchParams.state);

  const { data } = await query;
  let leads = (data ?? []) as LeadRow[];

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    leads = leads.filter((l) =>
      [l.first_name, l.last_name, l.phone, l.email, l.state]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-extrabold">Lead queue</h1>
      <p className="text-slate-400 text-sm mt-1">
        Sorted by priority, then newest first.
      </p>
      <LeadQueue leads={leads} initialFilters={searchParams} />
    </div>
  );
}
