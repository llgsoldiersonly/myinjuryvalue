import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, priority_order, active } = body;
  if (!name || !phone) return NextResponse.json({ error: "missing" }, { status: 400 });
  const sb = supabaseAdmin();
  const { error } = await sb.from("intake_reps").insert({ name, phone, priority_order, active });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { id, ...patch } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const sb = supabaseAdmin();
  const { error } = await sb.from("intake_reps").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const sb = supabaseAdmin();
  const { error } = await sb.from("intake_reps").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
