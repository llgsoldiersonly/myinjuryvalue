import { Resend } from "resend";
import { formatUsd } from "./scoring";
import type { LeadRow } from "./types";

let _client: Resend | null = null;
function client() {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing");
  _client = new Resend(key);
  return _client;
}

const FROM = () => process.env.RESEND_FROM_EMAIL || "My Injury Value <noreply@myinjuryvalue.com>";

export async function sendCaseValueEmail(lead: LeadRow): Promise<void> {
  if (!lead.email) return;
  const range = `${formatUsd(lead.value_min)} – ${formatUsd(lead.value_max)}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0B1220;color:#fff;border-radius:12px">
      <h1 style="margin:0 0 12px;font-size:22px">Your estimated case value</h1>
      <p style="margin:0 0 8px;color:#cbd5e1">Hi ${escape(lead.first_name)},</p>
      <p style="margin:0 0 16px;color:#cbd5e1">Based on your answers, your case may be worth:</p>
      <div style="background:#FFD60A;color:#0B1220;padding:16px 20px;border-radius:10px;font-size:24px;font-weight:700;text-align:center">${range}</div>
      <p style="margin:20px 0 8px;color:#cbd5e1">This is an estimate, not a guarantee. A case reviewer will reach out shortly to discuss your specific situation.</p>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:12px">My Injury Value</p>
    </div>`;
  try {
    await client().emails.send({
      from: FROM(),
      to: lead.email,
      subject: "Your estimated case value",
      html,
    });
  } catch (e) {
    console.error("resend email error", e);
  }
}

export async function sendBackupFollowUpEmail(lead: LeadRow): Promise<void> {
  if (!lead.email) return;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h1 style="margin:0 0 12px">We tried to reach you</h1>
      <p>Hi ${escape(lead.first_name)},</p>
      <p>We tried calling you about your accident case value estimate. Your answers suggest this case may be worth reviewing before you sign anything with insurance.</p>
      <p>Reply to this email or call us at ${process.env.CALLBACK_NUMBER ?? ""} when you're ready.</p>
      <p>— My Injury Value</p>
    </div>`;
  try {
    await client().emails.send({
      from: FROM(),
      to: lead.email,
      subject: "Quick follow-up about your case",
      html,
    });
  } catch (e) {
    console.error("resend follow-up error", e);
  }
}

export async function sendIntakeAlertEmail(lead: LeadRow): Promise<void> {
  const to = (process.env.INTAKE_EMAIL_TO ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!to.length) return;
  const range = `${formatUsd(lead.value_min)} – ${formatUsd(lead.value_max)}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif">
      <h2>New ${lead.lead_quality} lead — ${escape(lead.first_name)} ${escape(lead.last_name)}</h2>
      <p>Phone: ${escape(lead.phone)} · State: ${escape(lead.state)}</p>
      <p>Range: <b>${range}</b></p>
      <ul>
        <li>Accident: ${escape(lead.accident_type)}</li>
        <li>Injury: ${escape(lead.injury_level)}</li>
        <li>Treatment: ${escape(lead.medical_treatment)}</li>
        <li>Fault: ${escape(lead.fault)}</li>
        <li>Insurance offer: ${escape(lead.offer_amount) || "none"}</li>
        <li>Attorney: ${escape(lead.has_attorney)}</li>
        <li>Signed: ${escape(lead.signed_anything)}</li>
      </ul>
    </div>`;
  try {
    await client().emails.send({
      from: FROM(),
      to,
      subject: `[${lead.lead_quality}] ${lead.first_name ?? ""} ${lead.last_name ?? ""} — ${range}`,
      html,
    });
  } catch (e) {
    console.error("resend intake alert error", e);
  }
}

function escape(s: string | null | undefined): string {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
}
