import { NextRequest, NextResponse } from "next/server";
import { updateLatestCallAttempt } from "@/lib/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Twilio POSTs here when the conference recording is ready. We attach the
// recording URL to the lead's most recent call_attempts row.
async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead_id");
  if (!leadId) return new NextResponse("ok");

  const form = await req.formData();
  const recordingUrl = (form.get("RecordingUrl") || "").toString();
  const status = (form.get("RecordingStatus") || "").toString();
  const duration = parseInt((form.get("RecordingDuration") || "0").toString(), 10) || undefined;

  if (recordingUrl && status === "completed") {
    await updateLatestCallAttempt(leadId, {
      recording_url: recordingUrl,
      ...(duration ? { duration_seconds: duration } : {}),
    });
  }
  return new NextResponse("ok");
}

export const POST = handle;
export const GET = handle;
