import twilio from "twilio";
import { supabaseAdmin } from "./supabase";
import type { LeadRow } from "./types";

let _client: ReturnType<typeof twilio> | null = null;
export function twilioClient() {
  if (_client) return _client;
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  if (!sid || !token) throw new Error("Twilio creds missing");
  _client = twilio(sid, token);
  return _client;
}

export function publicBaseUrl(): string {
  const url = process.env.PUBLIC_BASE_URL;
  if (!url) throw new Error("PUBLIC_BASE_URL is not set");
  return url.replace(/\/$/, "");
}

export async function getNextIntakeRep(skipPhones: string[] = []): Promise<{ id: string; name: string; phone: string } | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("intake_reps")
    .select("id,name,phone,priority_order,active")
    .eq("active", true)
    .order("priority_order", { ascending: true });
  if (error || !data) return null;
  const next = data.find((r) => !skipPhones.includes(r.phone));
  return next ?? null;
}

// Kicks off the warm-transfer flow by calling the primary intake rep first.
// The whisper TwiML is served by /api/twilio/intake-whisper, which gathers DTMF
// and (on press 1) bridges the lead via /api/twilio/lead-intro.
//
// `baseUrl` should be passed by the caller from the inbound request's host
// (req.headers Host + x-forwarded-proto). Falling back to PUBLIC_BASE_URL is
// fine for cron jobs / dashboard-triggered retries, but the form-submit path
// passes the live request host so we never construct a URL pointing at a
// canonical that redirects (which Twilio chokes on with 12100).
export async function startWarmTransfer(lead: LeadRow, baseUrl?: string): Promise<void> {
  const sb = supabaseAdmin();
  const rep = await getNextIntakeRep();
  if (!rep) {
    await sb.from("call_attempts").insert({
      lead_id: lead.id,
      status: "failed",
      failure_reason: "no_intake_reps_active",
    });
    return;
  }

  const base = (baseUrl ?? publicBaseUrl()).replace(/\/$/, "");
  const from = process.env.TWILIO_PHONE_NUMBER!;
  const url = `${base}/api/twilio/intake-whisper?lead_id=${encodeURIComponent(lead.id)}&rep_phone=${encodeURIComponent(rep.phone)}`;
  const statusCallback = `${base}/api/twilio/status?lead_id=${encodeURIComponent(lead.id)}&leg=intake&rep_phone=${encodeURIComponent(rep.phone)}`;

  const call = await twilioClient().calls.create({
    to: rep.phone,
    from,
    url,
    method: "POST",
    statusCallback,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    statusCallbackMethod: "POST",
    timeout: 25,
  });

  await sb.from("call_attempts").insert({
    lead_id: lead.id,
    intake_rep_phone: rep.phone,
    intake_call_sid: call.sid,
    status: "calling_intake",
  });
}

export function buildWhisperScript(lead: LeadRow): string {
  const offer = lead.offer_amount?.trim() || "no offer";
  return [
    `New My Injury Value lead.`,
    `Name: ${lead.first_name ?? ""} ${lead.last_name ?? ""}.`,
    `Estimated case range: ${lead.value_min} to ${lead.value_max}.`,
    `Lead quality: ${lead.lead_quality}.`,
    `Accident type: ${lead.accident_type ?? "unknown"}.`,
    `Injury: ${lead.injury_level ?? "unknown"}.`,
    `Medical treatment: ${lead.medical_treatment ?? "unknown"}.`,
    `Still in pain: ${lead.still_in_pain ?? "not given"}.`,
    `Fault: ${lead.fault ?? "unknown"}.`,
    `Police came: ${lead.police_scene ?? "unknown"}.`,
    `Insurance spoken to: ${lead.insurance_spoken ?? "unknown"}.`,
    `Insurance offer: ${offer}.`,
    `Attorney status: ${lead.has_attorney ?? "unknown"}.`,
    `Signed anything: ${lead.signed_anything ?? "unknown"}.`,
    `Press 1 to call and connect with the lead now. Press 2 to skip.`,
  ].join(" ");
}

export function buildLeadIntroScript(firstName: string | undefined): string {
  return `Hi ${firstName ?? "there"}, this is My Injury Value. We're connecting you now with someone who can review the accident details you just submitted. Please hold for a moment.`;
}

export function buildLeadVoicemail(firstName: string | undefined, callback: string): string {
  return `Hi ${firstName ?? "there"}, this is My Injury Value. You just checked your accident case value online. Based on your answers, your case may deserve a closer review before you sign anything with insurance. Call us back at ${spellPhone(callback)}.`;
}

export function spellPhone(p: string): string {
  return p.replace(/\D/g, "").split("").join(" ");
}

// Updates the most recent call_attempts row for a lead. Use this instead of
// chaining .order().limit() on .update(), which supabase-js doesn't support.
export async function updateLatestCallAttempt(
  leadId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("call_attempts")
    .select("id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.id) return;
  await sb.from("call_attempts").update(patch).eq("id", data.id);
}

export async function sendSms(to: string, body: string): Promise<string | null> {
  if (process.env.DISABLE_SMS === "true") {
    console.log(`[sms-disabled] skipped → ${to}: ${body.slice(0, 80)}…`);
    return null;
  }
  try {
    const msg = await twilioClient().messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body,
    });
    return msg.sid;
  } catch (e) {
    console.error("twilio sms error", e);
    return null;
  }
}
