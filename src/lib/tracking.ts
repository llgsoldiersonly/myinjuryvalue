import type { Tracking } from "./types";

// Read attribution params from URL + cookies (client-side).
// fbp/fbc cookies are set by the Meta Pixel and are needed for CAPI deduplication.
export function readClientTracking(): Tracking {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const cookies = Object.fromEntries(
    document.cookie.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))] as const;
    })
  );

  const fbclid = params.get("fbclid") ?? undefined;
  let fbc = cookies._fbc;
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }

  return {
    source: params.get("source") ?? document.referrer ?? undefined,
    utm_source: params.get("utm_source") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    utm_adset: params.get("utm_adset") ?? undefined,
    utm_ad: params.get("utm_ad") ?? undefined,
    fbclid,
    fbp: cookies._fbp,
    fbc,
    event_source_url: window.location.href,
  };
}

export function newEventId(): string {
  // Used for CAPI/Pixel deduplication. Stable across client + server for one submission.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
