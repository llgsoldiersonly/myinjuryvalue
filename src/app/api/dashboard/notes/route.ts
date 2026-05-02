import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { lead_id, note, rep_name } = await req.json();
  if (!lead_id || !note) return NextResponse.json({ error: "missing" }, { status: 400 });
  const sb = supabaseAdmin();
  const { error } = await sb.from("lead_notes").insert({ lead_id, note, rep_name });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
