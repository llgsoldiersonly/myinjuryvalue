import type { LeadRow } from "./types";

// Picks the most actionable detail from the lead and uses it as the
// "key trigger" sentence in the intake opener script.
export function keyTrigger(lead: Partial<LeadRow>): string {
  if (lead.signed_anything === "Yes, settlement release")
    return "you may have already signed a settlement release";
  if (lead.offer_amount && lead.offer_amount.trim())
    return `the insurance company already offered you about ${lead.offer_amount}`;
  if (lead.insurance_offer === "Yes")
    return "the insurance company already made you an offer";
  if (lead.has_attorney === "Yes, and I signed")
    return "you've already signed with another attorney";
  if (lead.medical_treatment === "Ambulance / ER")
    return "you went to the ER after the accident";
  if (lead.still_in_pain === "Yes, every day")
    return "you're still in pain every day";
  if (lead.work_impact === "Missed work")
    return "the accident caused you to miss work";
  if (lead.fault === "Other driver" && lead.ticket === "Yes")
    return "the other driver was ticketed";
  return "this case has details that may affect what you're owed";
}

export function buildOpener(lead: Partial<LeadRow>, repName: string): string {
  return [
    `Hey ${lead.first_name ?? "there"}, this is ${repName} with My Injury Value.`,
    `I'm looking at your answers now — you said this was a ${lead.accident_type ?? "car accident"}, you had ${lead.injury_level ?? "an injury"}, and your treatment was ${lead.medical_treatment ?? "still being decided"}. Did I get that right?`,
    `The reason I'm calling quickly is because you also said ${keyTrigger(lead)}. That can make a big difference before you sign anything with insurance.`,
  ].join("\n\n");
}
