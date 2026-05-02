import { NextRequest, NextResponse } from "next/server";
import { sendCapiEvent, type CapiUserData } from "@/lib/meta-capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allow-list of events this generic route may forward. Sensitive events
// (e.g. Lead, with full PII) go through their dedicated routes instead.
const ALLOWED_EVENTS = new Set([
  "CompleteRegistration",
  "InitiateCheckout",
  "ViewContent",
  "Contact",
]);

interface Body {
  event_name: string;
  event_id: string;
  event_source_url?: string;
  custom_data?: Record<string, unknown>;
  user_data?: Pick<CapiUserData, "fbp" | "fbc" | "email" | "phone">;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.event_name || !body.event_id) {
    return NextResponse.json({ error: "Missing event_name or event_id" }, { status: 400 });
  }
  if (!ALLOWED_EVENTS.has(body.event_name)) {
    return NextResponse.json({ error: "Event not allowed on this route" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const ua = req.headers.get("user-agent") || undefined;

  const result = await sendCapiEvent({
    event_name: body.event_name,
    event_id: body.event_id,
    event_source_url: body.event_source_url,
    user_data: {
      ...(body.user_data ?? {}),
      client_ip: ip,
      user_agent: ua,
    },
    custom_data: body.custom_data,
  });

  if (!result.ok) {
    console.error("meta-capi error", result.error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
