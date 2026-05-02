"use client";
import { useEffect, useRef } from "react";
import { fireFbq } from "./MetaPixel";

interface Props {
  leadId: string;
  value: number;
  leadQuality: string;
}

// Fires CompleteRegistration on /result page view (client pixel + server CAPI).
// event_id is derived from leadId so reloading the page dedupes correctly.
export function ResultPixel({ leadId, value, leadQuality }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const event_id = `result_${leadId}`;
    const custom_data = {
      content_id: leadId,
      lead_quality: leadQuality,
      value,
      currency: "USD",
    };

    fireFbq("CompleteRegistration", custom_data, event_id);

    // Read fbp/fbc cookies so server-side CAPI can match the same user.
    const cookies = Object.fromEntries(
      document.cookie.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))] as const;
      })
    );

    void fetch("/api/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "CompleteRegistration",
        event_id,
        event_source_url: window.location.href,
        custom_data,
        user_data: { fbp: cookies._fbp, fbc: cookies._fbc },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [leadId, value, leadQuality]);

  return null;
}
