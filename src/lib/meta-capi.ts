import { createHash } from "crypto";
import type { LeadRow } from "./types";

function sha256(s: string): string {
  return createHash("sha256").update(s.trim().toLowerCase()).digest("hex");
}

function normalizePhone(p?: string): string {
  if (!p) return "";
  const digits = p.replace(/\D/g, "");
  // E.164-ish: ensure leading country code; assume US if 10 digits
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

export interface CapiResult { ok: boolean; error?: string; }

export async function sendLeadCapi(
  lead: LeadRow,
  opts: { eventId: string; clientIp?: string; userAgent?: string }
): Promise<CapiResult> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !token) return { ok: false, error: "missing-meta-env" };

  const userData: Record<string, string> = {};
  if (lead.email) userData.em = sha256(lead.email);
  if (lead.phone) userData.ph = sha256(normalizePhone(lead.phone));
  if (lead.first_name) userData.fn = sha256(lead.first_name);
  if (lead.last_name) userData.ln = sha256(lead.last_name);
  if (lead.state) userData.st = sha256(lead.state);
  if (lead.fbp) userData.fbp = lead.fbp;
  if (lead.fbc) userData.fbc = lead.fbc;
  if (opts.clientIp) userData.client_ip_address = opts.clientIp;
  if (opts.userAgent) userData.client_user_agent = opts.userAgent;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.eventId,
        action_source: "website",
        event_source_url: lead.event_source_url ?? process.env.PUBLIC_BASE_URL,
        user_data: userData,
        custom_data: {
          score: lead.score,
          lead_quality: lead.lead_quality,
          value: lead.value_max,
          currency: "USD",
          accident_type: lead.accident_type,
          injury_level: lead.injury_level,
          medical_treatment: lead.medical_treatment,
        },
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) {
    (payload as { test_event_code?: string }).test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
