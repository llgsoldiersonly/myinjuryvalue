export type LeadQuality =
  | "LOW"
  | "REVIEW"
  | "GOOD"
  | "HOT"
  | "HIGH_VALUE"
  | "URGENT_REVIEW";

export type LeadStatus =
  | "new"
  | "attempted"
  | "contacted"
  | "qualified"
  | "disqualified"
  | "signed"
  | "sold"
  | "lost";

export type CallStatus =
  | "pending"
  | "calling_intake"
  | "intake_answered"
  | "intake_accepted"
  | "calling_lead"
  | "connected"
  | "lead_no_answer"
  | "intake_no_answer"
  | "failed";

export interface CalculatorAnswers {
  injury_level?: string;
  vehicle_damage_gate?: string;
  accident_timing?: string;
  accident_type?: string;
  hit_and_run_details?: string;
  rideshare_status?: string;
  medical_treatment?: string;
  hospital_admitted?: string;
  planned_treatment?: string;
  no_treatment_reason?: string;
  still_in_pain?: string;
  fault?: string;
  ticket?: string;
  police_scene?: string;
  police_report?: string;
  no_police_reason?: string;
  other_driver_insured?: string;
  insurance_spoken?: string;
  insurance_offer?: string;
  offer_amount?: string;
  work_impact?: string;
  work_loss_details?: string;
  signed_anything?: string;
  has_attorney?: string;
  switching_attorney?: string;
  incident_description?: string;
  state?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

export interface Tracking {
  source?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_adset?: string;
  utm_ad?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  event_source_url?: string;
}

export interface ScoringResult {
  score: number;
  value_min: number;
  value_max: number;
  lead_quality: LeadQuality;
}

export interface LeadRow extends CalculatorAnswers, Tracking, ScoringResult {
  id: string;
  created_at: string;
  status: LeadStatus;
}
