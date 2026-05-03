import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { startWarmTransfer } from "@/lib/twilio";
import type { LeadRow } from "@/lib/types";

export const runtime = "nodejs";

// Re-trigger the warm-transfer flow for an existing lead from the dashboard.
export async function POST(req: NextRequest) {
  const { lead_id } = await req.json();
  if (!lead_id) return NextResponse.json({ error: "missing lead_id" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: lead } = await sb
    .from("case_calculator_leads")
    .select("*")
    .eq("id", lead_id)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  const baseUrl = host ? `${proto}://${host}` : undefined;

  try {
    await startWarmTransfer(lead as LeadRow, baseUrl);
  } catch (e) {
    console.error("call retry error", e);
    return NextResponse.json({ error: "twilio error" }, { status: 500 });
  }

  await sb.from("case_calculator_leads").update({ status: "attempted" }).eq("id", lead_id);
  return NextResponse.json({ ok: true });
}
