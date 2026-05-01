import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { scoreLead, formatUsd } from "@/lib/scoring";
import { sendLeadCapi } from "@/lib/meta-capi";
import { startWarmTransfer, sendSms } from "@/lib/twilio";
import { sendCaseValueEmail, sendIntakeAlertEmail } from "@/lib/resend";
import type { CalculatorAnswers, LeadRow, Tracking } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  answers: CalculatorAnswers;
  tracking?: Tracking;
  event_id?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { answers, tracking = {}, event_id } = body;

  if (!answers?.first_name || !answers.last_name || !answers.phone || !answers.email) {
    return NextResponse.json({ error: "Missing contact fields" }, { status: 400 });
  }

  const scoring = scoreLead(answers);
  const sb = supabaseAdmin();

  const insertRow = {
    ...answers,
    ...tracking,
    score: scoring.score,
    value_min: scoring.value_min,
    value_max: scoring.value_max,
    lead_quality: scoring.lead_quality,
    status: "new" as const,
  };

  const { data: lead, error } = await sb
    .from("case_calculator_leads")
    .insert(insertRow)
    .select("*")
    .single();

  if (error || !lead) {
    console.error("supabase insert error", error);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }

  const fullLead = lead as LeadRow;

  // Fire-and-forget side effects. Failures should not block the response.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const ua = req.headers.get("user-agent") || undefined;

  void Promise.allSettled([
    event_id ? sendLeadCapi(fullLead, { eventId: event_id, clientIp: ip, userAgent: ua }) : Promise.resolve(),
    startWarmTransfer(fullLead),
    sendCaseValueEmail(fullLead),
    sendIntakeAlertEmail(fullLead),
    sendLeadConfirmationSms(fullLead),
  ]);

  return NextResponse.json({
    id: fullLead.id,
    lead_quality: fullLead.lead_quality,
    value_min: fullLead.value_min,
    value_max: fullLead.value_max,
  });
}

async function sendLeadConfirmationSms(lead: LeadRow): Promise<void> {
  if (!lead.phone) return;
  const range = `${formatUsd(lead.value_min)}-${formatUsd(lead.value_max)}`;
  const body = `Hi ${lead.first_name ?? "there"}, this is My Injury Value. Your estimated case value range: ${range}. We'll call you shortly to review.`;
  await sendSms(lead.phone, body);
}
