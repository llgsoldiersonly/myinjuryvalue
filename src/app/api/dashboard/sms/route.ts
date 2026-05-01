import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/twilio";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { lead_id, body } = await req.json();
  if (!lead_id || !body?.trim()) return NextResponse.json({ error: "missing" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: lead } = await sb
    .from("case_calculator_leads")
    .select("phone,first_name,last_name")
    .eq("id", lead_id)
    .maybeSingle();

  if (!lead?.phone) return NextResponse.json({ error: "lead phone missing" }, { status: 400 });

  const merged = body
    .replace(/\{first_name\}/g, lead.first_name ?? "")
    .replace(/\{last_name\}/g, lead.last_name ?? "");

  const sid = await sendSms(lead.phone, merged);
  if (!sid) return NextResponse.json({ error: "twilio error" }, { status: 500 });
  return NextResponse.json({ ok: true, sid });
}
