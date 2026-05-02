import type { CalculatorAnswers } from "./types";

export type QuestionType = "single" | "text" | "longtext" | "state" | "contact";

export interface Question {
  id: keyof CalculatorAnswers | "contact";
  field?: keyof CalculatorAnswers;
  type: QuestionType;
  question: string;
  options?: string[];
  microcopy?: string;
  placeholder?: string;
  showIf?: (a: CalculatorAnswers) => boolean;
  validationMessage?: string;
}

export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington D.C."
];

export const QUESTIONS: Question[] = [
  // Step 1
  {
    id: "injury_level",
    field: "injury_level",
    type: "single",
    question: "Were you hurt or in pain after the accident?",
    options: ["Yes, still in pain", "Yes, but improving", "Yes, minor soreness", "No, not really"],
    microcopy: "Pain after a crash can matter, even if it started small.",
  },
  // Step 2A — gate when no injury
  {
    id: "vehicle_damage_gate",
    field: "vehicle_damage_gate",
    type: "single",
    question: "Was your vehicle badly damaged or totaled?",
    options: ["Totaled", "Major damage", "Minor damage", "No damage"],
    showIf: (a) => a.injury_level === "No, not really",
  },
  // Step 2
  {
    id: "accident_timing",
    field: "accident_timing",
    type: "single",
    question: "When did the accident happen?",
    options: [
      "Today / yesterday",
      "Within the last 7 days",
      "Within the last 30 days",
      "1-3 months ago",
      "4-6 months ago",
      "6-12 months ago",
      "Over 1 year ago",
    ],
  },
  // Step 3
  {
    id: "accident_type",
    field: "accident_type",
    type: "single",
    question: "What type of accident was it?",
    options: [
      "Car vs car",
      "Motorcycle accident",
      "Truck / big rig accident",
      "Uber / Lyft / delivery driver",
      "Pedestrian hit by vehicle",
      "Bicycle accident",
      "Hit and run",
      "Single-car accident",
    ],
  },
  // Step 3A
  {
    id: "hit_and_run_details",
    field: "hit_and_run_details",
    type: "single",
    question: "Do you know if the driver was identified?",
    options: ["Yes, driver identified", "No, driver fled", "Not sure yet"],
    showIf: (a) => a.accident_type === "Hit and run",
  },
  // Step 3B
  {
    id: "rideshare_status",
    field: "rideshare_status",
    type: "single",
    question: "Was the driver working at the time?",
    options: [
      "Yes, they were carrying passenger / delivery",
      "Yes, app was on",
      "Not sure",
      "No",
    ],
    showIf: (a) => a.accident_type === "Uber / Lyft / delivery driver",
  },
  // Step 4
  {
    id: "medical_treatment",
    field: "medical_treatment",
    type: "single",
    question: "Did you need medical care?",
    options: [
      "Ambulance / ER",
      "Urgent care",
      "Doctor / specialist",
      "Chiropractor / physical therapy",
      "Not yet, but I plan to",
      "No medical treatment",
    ],
  },
  // Step 4A
  {
    id: "hospital_admitted",
    field: "hospital_admitted",
    type: "single",
    question: "Were you admitted overnight?",
    options: ["Yes", "No", "Not sure"],
    showIf: (a) => a.medical_treatment === "Ambulance / ER",
  },
  // Step 4B
  {
    id: "planned_treatment",
    field: "planned_treatment",
    type: "single",
    question: "When are you planning to see a doctor?",
    options: ["Today / tomorrow", "This week", "Not scheduled yet", "Not sure"],
    showIf: (a) => a.medical_treatment === "Not yet, but I plan to",
  },
  // Step 4C
  {
    id: "no_treatment_reason",
    field: "no_treatment_reason",
    type: "single",
    question: "Why haven't you received medical treatment?",
    options: [
      "I thought pain would go away",
      "I cannot afford it",
      "I do not have health insurance",
      "I was not injured",
      "Other",
    ],
    showIf: (a) => a.medical_treatment === "No medical treatment",
  },
  // Step 5
  {
    id: "still_in_pain",
    field: "still_in_pain",
    type: "single",
    question: "Are you still experiencing pain?",
    options: ["Yes, every day", "Sometimes", "No"],
    showIf: (a) => a.injury_level !== "No, not really" && !!a.injury_level,
  },
  // Mid-funnel reassurance message handled in UI via question id "_midfunnel" — implemented as a flag.
  // Step 6
  {
    id: "fault",
    field: "fault",
    type: "single",
    question: "Who caused the accident?",
    options: ["Other driver", "Both of us", "Not sure", "I may have been at fault"],
    validationMessage:
      "Even if you're not sure, you may still have a case. Keep going.",
  },
  // Step 6A
  {
    id: "ticket",
    field: "ticket",
    type: "single",
    question: "Did the other driver get a ticket?",
    options: ["Yes", "No", "Not sure"],
    showIf: (a) => a.fault === "Other driver",
  },
  // Step 7
  {
    id: "police_scene",
    field: "police_scene",
    type: "single",
    question: "Did police come to the scene?",
    options: ["Yes", "No", "Not sure"],
  },
  // Step 7A
  {
    id: "police_report",
    field: "police_report",
    type: "single",
    question: "Do you have a report or case number?",
    options: [
      "Yes, I have it",
      "Police came, but I do not have it yet",
      "No",
      "Not sure",
    ],
    showIf: (a) => a.police_scene === "Yes",
  },
  // Step 7B
  {
    id: "no_police_reason",
    field: "no_police_reason",
    type: "single",
    question: "Why wasn't a police report filed?",
    options: [
      "Minor accident",
      "Other driver wanted to avoid police",
      "I did not know I needed one",
      "Police would not come",
      "Not sure",
    ],
    showIf: (a) => a.police_scene === "No",
  },
  // Step 8
  {
    id: "other_driver_insured",
    field: "other_driver_insured",
    type: "single",
    question: "Did the other driver have insurance?",
    options: ["Yes", "No", "I do not know", "Hit and run"],
  },
  // Step 9
  {
    id: "insurance_spoken",
    field: "insurance_spoken",
    type: "single",
    question: "Have you spoken to insurance yet?",
    options: ["Yes, my insurance", "Yes, their insurance", "Yes, both", "No, not yet"],
  },
  // Step 9A
  {
    id: "insurance_offer",
    field: "insurance_offer",
    type: "single",
    question: "Did they offer you money yet?",
    options: ["Yes", "No", "Not sure"],
    showIf: (a) => !!a.insurance_spoken && a.insurance_spoken !== "No, not yet",
  },
  // Step 9B
  {
    id: "offer_amount",
    field: "offer_amount",
    type: "text",
    question: "About how much did they offer?",
    placeholder: "Example: $4,000",
    showIf: (a) => a.insurance_offer === "Yes",
  },
  // Step 10
  {
    id: "work_impact",
    field: "work_impact",
    type: "single",
    question: "Did the accident affect your ability to work?",
    options: ["Missed work", "Reduced hours", "No impact", "Not sure yet"],
  },
  // Step 10A
  {
    id: "work_loss_details",
    field: "work_loss_details",
    type: "single",
    question: "About how much work have you missed?",
    options: ["1-2 days", "3-7 days", "More than a week", "Still missing work", "Not sure"],
    showIf: (a) => a.work_impact === "Missed work" || a.work_impact === "Reduced hours",
  },
  // Step 11
  {
    id: "signed_anything",
    field: "signed_anything",
    type: "single",
    question: "Have you signed anything with insurance?",
    options: ["No", "Yes, paperwork", "Yes, settlement release", "I'm not sure"],
  },
  // Step 12
  {
    id: "has_attorney",
    field: "has_attorney",
    type: "single",
    question: "Do you already have a lawyer?",
    options: ["No", "Yes, but unsure", "Yes, and I signed", "I had one, but dropped them"],
  },
  // Step 12A
  {
    id: "switching_attorney",
    field: "switching_attorney",
    type: "single",
    question: "Are you considering switching attorneys?",
    options: ["Yes", "No", "Not sure"],
    showIf: (a) => a.has_attorney === "Yes, but unsure" || a.has_attorney === "Yes, and I signed",
  },
  // Step 13
  {
    id: "incident_description",
    field: "incident_description",
    type: "longtext",
    question: "Briefly tell us what happened.",
    placeholder:
      "Example: I was stopped at a red light and got rear-ended. Police came, I went to urgent care, and I've had neck pain since.",
  },
  // Step 14
  {
    id: "state",
    field: "state",
    type: "state",
    question: "What state did this happen in?",
  },
  // Step 15 - contact (handled specially in UI)
  {
    id: "contact",
    type: "contact",
    question: "You may qualify. Where should we send your estimate?",
  },
];

// Returns the visible question list for the current answers
export function visibleQuestions(answers: CalculatorAnswers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}
