import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getNextIntakeRep, publicBaseUrl, twilioClient } from "@/lib/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Twilio status callback. Updates call_attempts with terminal state, and
// rolls over to the backup intake rep on no-answer.
async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead_id");
  const leg = url.searchParams.get("leg") ?? "intake";
  const repPhone = url.searchParams.get("rep_phone") ?? "";
  if (!leadId) return new NextResponse("ok");

  const form = await req.formData();
  const callStatus = (form.get("CallStatus") || "").toString();
  const callSid = (form.get("CallSid") || "").toString();
  const duration = parseInt((form.get("CallDuration") || "0").toString(), 10) || 0;
  const recordingUrl = (form.get("RecordingUrl") || "").toString();

  const sb = supabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (callStatus === "completed") updates.duration_seconds = duration;
  if (recordingUrl) updates.recording_url = recordingUrl;

  if (leg === "intake") {
    if (callStatus === "no-answer" || callStatus === "busy" || callStatus === "failed") {
      updates.status = "intake_no_answer";
      updates.failure_reason = callStatus;
    }
  } else if (leg === "lead") {
    if (callStatus === "no-answer" || callStatus === "busy" || callStatus === "failed") {
      updates.status = "lead_no_answer";
      updates.failure_reason = callStatus;
    }
    if (callStatus === "completed" && duration > 0) {
      updates.status = "connected";
    }
  }

  if (Object.keys(updates).length) {
    const matchKey = leg === "intake" ? "intake_call_sid" : "lead_call_sid";
    await sb.from("call_attempts").update(updates).eq(matchKey, callSid);
  }

  // Backup roll-over
  if (leg === "intake" && (callStatus === "no-answer" || callStatus === "busy" || callStatus === "failed")) {
    const backup = await getNextIntakeRep([repPhone]);
    if (backup) {
      const base = publicBaseUrl();
      const whisperUrl = `${base}/api/twilio/intake-whisper?lead_id=${encodeURIComponent(leadId)}&rep_phone=${encodeURIComponent(backup.phone)}`;
      const statusCb = `${base}/api/twilio/status?lead_id=${encodeURIComponent(leadId)}&leg=intake&rep_phone=${encodeURIComponent(backup.phone)}`;
      try {
        const call = await twilioClient().calls.create({
          to: backup.phone,
          from: process.env.TWILIO_PHONE_NUMBER!,
          url: whisperUrl,
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
        console.error("backup roll-over error", e);
      }
    }
  }

  return new NextResponse("ok");
}

export const POST = handle;
export const GET = handle;
