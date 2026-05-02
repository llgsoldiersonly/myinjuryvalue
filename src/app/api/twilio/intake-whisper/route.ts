import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildWhisperScript, publicBaseUrl, updateLatestCallAttempt } from "@/lib/twilio";
import type { LeadRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TwiML served when the intake rep answers. Plays a summary of the lead and gathers
// DTMF; Press 1 = connect to lead, Press 2 = skip.
async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead_id");
  const repPhone = url.searchParams.get("rep_phone") ?? "";
  if (!leadId) return new NextResponse("missing lead_id", { status: 400 });

  const sb = supabaseAdmin();
  const { data: lead } = await sb
    .from("case_calculator_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  // Mark intake_answered
  await updateLatestCallAttempt(leadId, { status: "intake_answered" });

  const script = lead
    ? buildWhisperScript(lead as LeadRow)
    : "New My Injury Value lead. Press 1 to connect, 2 to skip.";

  // Use a relative URL so Twilio resolves it against whichever host it called
  // (avoids apex/www canonical-redirect mismatches).
  const action = `/api/twilio/intake-gather?lead_id=${encodeURIComponent(leadId)}&rep_phone=${encodeURIComponent(repPhone)}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${action}" method="POST" timeout="8">
    <Say voice="Polly.Joanna-Neural">${escapeXml(script)}</Say>
  </Gather>
  <Say voice="Polly.Joanna-Neural">No input received. Goodbye.</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

export const POST = handle;
export const GET = handle;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
