import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "new","attempted","contacted","qualified","disqualified","signed","sold","lost",
]);

export async function POST(req: NextRequest) {
  const { lead_id, status } = await req.json();
  if (!lead_id || !ALLOWED.has(status)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const sb = supabaseAdmin();
  const { error } = await sb.from("case_calculator_leads").update({ status }).eq("id", lead_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
