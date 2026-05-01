import type { CalculatorAnswers, ScoringResult, LeadQuality } from "./types";

// Scoring philosophy:
//   start at 0, accumulate "hot signals", subtract "bad signals", clamp to [0, 100].
//   Then derive lead_quality from score and a few hard overrides.
//   value range is anchored to score buckets and nudged by treatment severity.
export function scoreLead(a: CalculatorAnswers): ScoringResult {
  let score = 0;

  // Injury
  switch (a.injury_level) {
    case "Yes, still in pain": score += 22; break;
    case "Yes, but improving": score += 14; break;
    case "Yes, minor soreness": score += 6; break;
    case "No, not really": score -= 12; break;
  }

  // Vehicle damage gate (only when no injury)
  switch (a.vehicle_damage_gate) {
    case "Totaled": score += 6; break;
    case "Major damage": score += 4; break;
    case "Minor damage": score += 1; break;
    case "No damage": score -= 8; break;
  }

  // Timing
  switch (a.accident_timing) {
    case "Today / yesterday": score += 12; break;
    case "Within the last 7 days": score += 10; break;
    case "Within the last 30 days": score += 8; break;
    case "1-3 months ago": score += 5; break;
    case "4-6 months ago": score += 2; break;
    case "6-12 months ago": score -= 2; break;
    case "Over 1 year ago": score -= 10; break;
  }

  // Accident type
  switch (a.accident_type) {
    case "Truck / big rig accident": score += 12; break;
    case "Motorcycle accident": score += 8; break;
    case "Pedestrian hit by vehicle": score += 10; break;
    case "Bicycle accident": score += 6; break;
    case "Uber / Lyft / delivery driver": score += 6; break;
    case "Car vs car": score += 4; break;
    case "Hit and run": score += 2; break;
    case "Single-car accident": score -= 4; break;
  }

  if (a.hit_and_run_details === "Yes, driver identified") score += 4;
  if (a.hit_and_run_details === "No, driver fled") score -= 2;

  if (a.rideshare_status === "Yes, they were carrying passenger / delivery") score += 4;
  if (a.rideshare_status === "Yes, app was on") score += 2;

  // Treatment
  switch (a.medical_treatment) {
    case "Ambulance / ER": score += 14; break;
    case "Urgent care": score += 8; break;
    case "Doctor / specialist": score += 7; break;
    case "Chiropractor / physical therapy": score += 5; break;
    case "Not yet, but I plan to": score += 2; break;
    case "No medical treatment": score -= 8; break;
  }

  if (a.hospital_admitted === "Yes") score += 6;
  if (a.planned_treatment === "Today / tomorrow") score += 3;
  if (a.planned_treatment === "This week") score += 2;

  if (a.no_treatment_reason === "I cannot afford it") score += 2; // not their fault
  if (a.no_treatment_reason === "I do not have health insurance") score += 2;
  if (a.no_treatment_reason === "I was not injured") score -= 6;

  // Ongoing pain
  if (a.still_in_pain === "Yes, every day") score += 8;
  if (a.still_in_pain === "Sometimes") score += 4;
  if (a.still_in_pain === "No") score -= 2;

  // Fault
  switch (a.fault) {
    case "Other driver": score += 14; break;
    case "Both of us": score += 2; break;
    case "Not sure": score += 0; break;
    case "I may have been at fault": score -= 12; break;
  }

  if (a.ticket === "Yes") score += 6;

  // Police
  if (a.police_scene === "Yes") score += 4;
  if (a.police_report === "Yes, I have it") score += 4;

  // Other driver insurance
  if (a.other_driver_insured === "Yes") score += 6;
  if (a.other_driver_insured === "No") score -= 4;
  if (a.other_driver_insured === "Hit and run") score -= 2;

  // Insurance contact + offer
  if (a.insurance_offer === "Yes") score += 6;

  // Work impact
  if (a.work_impact === "Missed work") score += 6;
  if (a.work_impact === "Reduced hours") score += 3;
  if (a.work_loss_details === "More than a week") score += 4;
  if (a.work_loss_details === "Still missing work") score += 6;

  // Attorney
  if (a.has_attorney === "No") score += 6;
  if (a.has_attorney === "Yes, and I signed") score -= 16;
  if (a.has_attorney === "I had one, but dropped them") score += 2;
  if (a.switching_attorney === "Yes") score += 4;

  // Signed
  if (a.signed_anything === "No") score += 4;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // Hard overrides for lead_quality
  let lead_quality: LeadQuality;
  if (a.signed_anything === "Yes, settlement release") {
    lead_quality = "URGENT_REVIEW";
  } else if (a.has_attorney === "Yes, and I signed" && a.switching_attorney !== "Yes") {
    lead_quality = "LOW";
  } else if (a.injury_level === "No, not really" && a.vehicle_damage_gate === "No damage") {
    lead_quality = "LOW";
  } else if (score >= 80) {
    lead_quality = "HIGH_VALUE";
  } else if (score >= 65) {
    lead_quality = "HOT";
  } else if (score >= 45) {
    lead_quality = "GOOD";
  } else if (score >= 25) {
    lead_quality = "REVIEW";
  } else {
    lead_quality = "LOW";
  }

  // Value range buckets (USD)
  const buckets: Record<LeadQuality, [number, number]> = {
    LOW: [0, 5_000],
    REVIEW: [3_000, 15_000],
    GOOD: [10_000, 35_000],
    HOT: [25_000, 75_000],
    HIGH_VALUE: [50_000, 250_000],
    URGENT_REVIEW: [10_000, 100_000],
  };
  let [value_min, value_max] = buckets[lead_quality];

  // Severity bumps
  if (a.medical_treatment === "Ambulance / ER" && a.hospital_admitted === "Yes") {
    value_max = Math.round(value_max * 1.3);
  }
  if (a.accident_type === "Truck / big rig accident") {
    value_max = Math.round(value_max * 1.4);
  }
  if (a.fault === "I may have been at fault") {
    value_max = Math.round(value_max * 0.5);
    value_min = Math.round(value_min * 0.5);
  }

  return { score, value_min, value_max, lead_quality };
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
