// SMS via textbee.dev. Their gateway sends from an Android device you've
// paired in the textbee dashboard, so it sidesteps A2P 10DLC entirely.
//
// Required env:
//   TEXTBEE_API_KEY   — from https://textbee.dev/dashboard (API Keys)
//   TEXTBEE_DEVICE_ID — the paired device's ID
//
// Set DISABLE_SMS=true to short-circuit all sends (useful for staging).
const TEXTBEE_BASE = "https://api.textbee.dev/api/v1";

export async function sendSms(to: string, body: string): Promise<string | null> {
  if (process.env.DISABLE_SMS === "true") {
    console.log(`[sms-disabled] skipped → ${to}: ${body.slice(0, 80)}…`);
    return null;
  }

  const apiKey = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;
  if (!apiKey || !deviceId) {
    console.error("textbee env missing (TEXTBEE_API_KEY / TEXTBEE_DEVICE_ID)");
    return null;
  }

  try {
    const res = await fetch(
      `${TEXTBEE_BASE}/gateway/devices/${encodeURIComponent(deviceId)}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ recipients: [to], message: body }),
        // No fetch caching for outbound calls
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`textbee sms error ${res.status}: ${text}`);
      return null;
    }
    const json = (await res.json().catch(() => null)) as
      | { data?: { smsBatch?: { _id?: string } } }
      | null;
    return json?.data?.smsBatch?._id ?? "sent";
  } catch (e) {
    console.error("textbee sms exception", e);
    return null;
  }
}
