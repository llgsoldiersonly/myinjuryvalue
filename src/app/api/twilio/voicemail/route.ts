import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildLeadVoicemail, sendSms, updateLatestCallAttempt } from "@/lib/twilio";
import { sendBackupFollowUpEmail } from "@/lib/resend";
import type { LeadRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Played when the lead does not answer. Also sends the missed-call SMS and
// triggers the backup follow-up email + intake-team SMS alert.
async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead_id");
  if (!leadId) return new NextResponse("missing lead_id", { status: 400 });

  const sb = supabaseAdmin();
  const { data: lead } = await sb
    .from("case_calculator_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  const fullLead = lead as LeadRow | null;

  await updateLatestCallAttempt(leadId, { status: "lead_no_answer" });

  await sb
    .from("case_calculator_leads")
    .update({ status: "attempted" })
    .eq("id", leadId);

  const callback = process.env.CALLBACK_NUMBER ?? "";
  const vm = buildLeadVoicemail(fullLead?.first_name ?? undefined, callback);

  // Fire async fallbacks
  if (fullLead?.phone) {
    void sendSms(
      fullLead.phone,
      `Hey ${fullLead.first_name ?? ""}, we just tried calling about your accident case value estimate. Your answers suggest this may be worth reviewing before signing anything. Call us here: ${callback}`
    );
  }
  if (fullLead) void sendBackupFollowUpEmail(fullLead);
  void sendIntakeMissedCallAlert(fullLead);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">${escapeXml(vm)}</Say>
  <Hangup/>
</Response>`;
  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}

export const POST = handle;
export const GET = handle;

async function sendIntakeMissedCallAlert(lead: LeadRow | null) {
  if (!lead) return;
  const sb = supabaseAdmin();
  const { data: reps } = await sb
    .from("intake_reps")
    .select("phone,active")
    .eq("active", true);
  if (!reps?.length) return;
  const offer = lead.offer_amount?.trim() || "none";
  const body = `New ${lead.lead_quality} accident lead missed.\nName: ${lead.first_name ?? ""} ${lead.last_name ?? ""}\nPhone: ${lead.phone ?? ""}\nRange: ${lead.value_min}-${lead.value_max}\nInjury: ${lead.injury_level ?? ""}\nTreatment: ${lead.medical_treatment ?? ""}\nInsurance offer: ${offer}\nCall ASAP.`;
  await Promise.all(reps.map((r) => sendSms(r.phone, body)));
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
