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

export interface CapiUserData {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  state?: string;
  fbp?: string;
  fbc?: string;
  client_ip?: string;
  user_agent?: string;
}

export interface CapiEventInput {
  event_name: string;
  event_id: string;
  event_source_url?: string;
  user_data?: CapiUserData;
  custom_data?: Record<string, unknown>;
}

function hashUserData(u: CapiUserData = {}): Record<string, string> {
  const out: Record<string, string> = {};
  if (u.email) out.em = sha256(u.email);
  if (u.phone) out.ph = sha256(normalizePhone(u.phone));
  if (u.first_name) out.fn = sha256(u.first_name);
  if (u.last_name) out.ln = sha256(u.last_name);
  if (u.state) out.st = sha256(u.state);
  if (u.fbp) out.fbp = u.fbp;
  if (u.fbc) out.fbc = u.fbc;
  if (u.client_ip) out.client_ip_address = u.client_ip;
  if (u.user_agent) out.client_user_agent = u.user_agent;
  return out;
}

export async function sendCapiEvent(input: CapiEventInput): Promise<CapiResult> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !token) return { ok: false, error: "missing-meta-env" };

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.event_id,
        action_source: "website",
        event_source_url: input.event_source_url ?? process.env.PUBLIC_BASE_URL,
        user_data: hashUserData(input.user_data),
        custom_data: input.custom_data ?? {},
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

export async function sendLeadCapi(
  lead: LeadRow,
  opts: { eventId: string; clientIp?: string; userAgent?: string }
): Promise<CapiResult> {
  return sendCapiEvent({
    event_name: "Lead",
    event_id: opts.eventId,
    event_source_url: lead.event_source_url ?? process.env.PUBLIC_BASE_URL,
    user_data: {
      email: lead.email,
      phone: lead.phone,
      first_name: lead.first_name,
      last_name: lead.last_name,
      state: lead.state,
      fbp: lead.fbp,
      fbc: lead.fbc,
      client_ip: opts.clientIp,
      user_agent: opts.userAgent,
    },
    custom_data: {
      score: lead.score,
      lead_quality: lead.lead_quality,
      value: lead.value_max,
      currency: "USD",
      accident_type: lead.accident_type,
      injury_level: lead.injury_level,
      medical_treatment: lead.medical_treatment,
    },
  });
}
