import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildLeadIntroScript, publicBaseUrl, updateLatestCallAttempt } from "@/lib/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TwiML served when Twilio calls the lead. Plays an intro then puts them in the
// same conference as the rep. If they don't pick up, /voicemail is invoked.
async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead_id");
  const conference = url.searchParams.get("conference") ?? `lead-${leadId}`;
  if (!leadId) return new NextResponse("missing lead_id", { status: 400 });

  const sb = supabaseAdmin();
  const { data: lead } = await sb
    .from("case_calculator_leads")
    .select("first_name")
    .eq("id", leadId)
    .maybeSingle();

  const intro = buildLeadIntroScript(lead?.first_name ?? undefined);
  const base = publicBaseUrl();
  const vmUrl = `${base}/api/twilio/voicemail?lead_id=${encodeURIComponent(leadId)}`;

  // If the call goes straight to voicemail, AnsweredBy is set on the call resource.
  // Twilio will follow the URL when answered; for a no-answer, the status webhook
  // handles SMS fallback. We attach a vm action via <Dial>.
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">${escapeXml(intro)}</Say>
  <Dial action="${vmUrl}" method="POST">
    <Conference startConferenceOnEnter="true" endConferenceOnExit="true" beep="false">
      ${escapeXml(conference)}
    </Conference>
  </Dial>
</Response>`;

  await updateLatestCallAttempt(leadId, { status: "connected" });

  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
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
