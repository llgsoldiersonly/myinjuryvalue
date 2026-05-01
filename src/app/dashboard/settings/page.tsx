import { supabaseAdmin } from "@/lib/supabase";
import { RepEditor } from "@/components/dashboard/RepEditor";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const sb = supabaseAdmin();
  const { data } = await sb.from("intake_reps").select("*").order("priority_order", { ascending: true });

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-extrabold">Intake routing</h1>
      <p className="text-slate-400 text-sm mt-1">
        Reps are called in priority order. Lower number = higher priority.
      </p>
      <RepEditor reps={data ?? []} />
    </div>
  );
}
