import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getNextIntakeRep, publicBaseUrl, twilioClient, updateLatestCallAttempt } from "@/lib/twilio";
import type { LeadRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Twilio POSTs the gathered digit here. On press 1, we dial the lead and join
// both legs into a conference; on press 2 (or any non-1), we end the call and
// try the next intake rep.
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead_id");
  const repPhone = url.searchParams.get("rep_phone") ?? "";
  if (!leadId) return new NextResponse("missing lead_id", { status: 400 });

  const form = await req.formData();
  const digits = (form.get("Digits") || "").toString();

  const sb = supabaseAdmin();

  if (digits === "1") {
    await updateLatestCallAttempt(leadId, { status: "intake_accepted", accepted_by: repPhone });

    const { data: lead } = await sb
      .from("case_calculator_leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();
    const fullLead = lead as LeadRow | null;

    if (!fullLead?.phone) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna-Neural">Lead phone missing. Goodbye.</Say><Hangup/></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    const conferenceName = `lead-${leadId}`;
    const base = publicBaseUrl();

    // Dial the lead and route them into the same conference room.
    const leadStatusCb = `${base}/api/twilio/status?lead_id=${encodeURIComponent(leadId)}&leg=lead`;
    const leadIntroUrl = `${base}/api/twilio/lead-intro?lead_id=${encodeURIComponent(leadId)}&conference=${encodeURIComponent(conferenceName)}`;

    try {
      const call = await twilioClient().calls.create({
        to: fullLead.phone,
        from: process.env.TWILIO_PHONE_NUMBER!,
        url: leadIntroUrl,
        method: "POST",
        statusCallback: leadStatusCb,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed", "no-answer", "busy", "failed"],
        statusCallbackMethod: "POST",
        timeout: 25,
      });
      await updateLatestCallAttempt(leadId, { status: "calling_lead", lead_call_sid: call.sid });
    } catch (e) {
      console.error("error dialing lead", e);
    }

    // Park the rep in the conference until the lead joins. Conference is
    // recorded; Twilio POSTs the recording URL to /api/twilio/conference-recording
    // once it's ready. URL is relative so it works regardless of canonical host.
    const recordingCb = `/api/twilio/conference-recording?lead_id=${encodeURIComponent(leadId)}`;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">Connecting you now. Please hold.</Say>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="true" beep="false" waitUrl="" record="record-from-start" recordingStatusCallback="${recordingCb}" recordingStatusCallbackMethod="POST">
      ${escapeXml(conferenceName)}
    </Conference>
  </Dial>
</Response>`;
    return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Skipped — try backup rep.
  await updateLatestCallAttempt(leadId, {
    status: "failed",
    failure_reason: `intake_skipped:${repPhone}`,
  });

  // Kick off backup — use the host Twilio just called us on.
  const backup = await getNextIntakeRep([repPhone]);
  if (backup) {
    const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
    const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
    const base = host ? `${proto}://${host}` : publicBaseUrl();
    const url2 = `${base}/api/twilio/intake-whisper?lead_id=${encodeURIComponent(leadId)}&rep_phone=${encodeURIComponent(backup.phone)}`;
    const statusCb = `${base}/api/twilio/status?lead_id=${encodeURIComponent(leadId)}&leg=intake&rep_phone=${encodeURIComponent(backup.phone)}`;
    try {
      const call = await twilioClient().calls.create({
        to: backup.phone,
        from: process.env.TWILIO_PHONE_NUMBER!,
        url: url2,
        method: "POST",
        statusCallback: statusCb,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
        timeout: 25,
      });
      await sb.from("call_attempts").insert({
        lead_id: leadId,
        intake_rep_phone: backup.phone,
        intake_call_sid: call.sid,
        status: "calling_intake",
      });
    } catch (e) {
      console.error("backup dial error", e);
    }
  }

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna-Neural">Skipping. Goodbye.</Say><Hangup/></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
