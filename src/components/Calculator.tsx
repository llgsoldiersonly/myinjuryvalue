"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { ProgressBar } from "./ProgressBar";
import { fireFbq } from "./MetaPixel";
import { QUESTIONS, US_STATES, visibleQuestions, type Question } from "@/lib/questions";
import type { CalculatorAnswers } from "@/lib/types";
import { readClientTracking, newEventId } from "@/lib/tracking";

// Mid-funnel reassurance shows once after the fault step is answered.
const MID_FUNNEL_AFTER: keyof CalculatorAnswers = "fault";

export function Calculator() {
  const router = useRouter();
  const [answers, setAnswers] = useState<CalculatorAnswers>({});
  const [history, setHistory] = useState<number[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [showMidFunnel, setShowMidFunnel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitGuard = useRef(false);

  // ViewContent on calculator open
  useEffect(() => {
    fireFbq("ViewContent", { content_category: "calculator_start" });
  }, []);

  const visible = useMemo(() => visibleQuestions(answers), [answers]);
  const current: Question | undefined = visible[stepIndex];

  // Adjust step index if conditional changes shrink the list out from under us
  useEffect(() => {
    if (stepIndex > visible.length - 1) setStepIndex(Math.max(0, visible.length - 1));
  }, [visible.length, stepIndex]);

  const totalForProgress = visible.length || QUESTIONS.length;
  const progress = ((stepIndex + (current?.type === "contact" ? 1 : 0.4)) / totalForProgress) * 100;

  function next() {
    if (!current) return;
    if (current.field === MID_FUNNEL_AFTER && !showMidFunnel) {
      setShowMidFunnel(true);
      return;
    }
    setHistory((h) => [...h, stepIndex]);
    setStepIndex((i) => i + 1);
  }

  function back() {
    setError(null);
    if (showMidFunnel) {
      setShowMidFunnel(false);
      return;
    }
    if (stepIndex === 0) {
      router.push("/");
      return;
    }
    setHistory((h) => h.slice(0, -1));
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function setField(field: keyof CalculatorAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }

  function pickOption(field: keyof CalculatorAnswers, value: string) {
    setField(field, value);
    // Auto-advance after a tiny delay so the tap feels responsive
    setTimeout(next, 90);
  }

  async function submit(final: CalculatorAnswers) {
    if (submitGuard.current) return;
    submitGuard.current = true;
    setSubmitting(true);
    setError(null);

    fireFbq("Contact");
    fireFbq("CompleteRegistration");

    const tracking = readClientTracking();
    const event_id = newEventId();
    fireFbq("Lead", { content_category: "case_calculator" }, event_id);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: final, tracking, event_id }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to submit");
      }
      const json = await res.json();
      const params = new URLSearchParams({ id: json.id });
      router.push(`/result?${params.toString()}`);
    } catch (e) {
      submitGuard.current = false;
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="px-5 py-4 md:px-10 border-b border-slate-100 sticky top-0 bg-white z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={back} className="text-sm font-semibold text-slate-500 hover:text-brand-navy">
            ← Back
          </button>
          <Logo size="sm" withMark={false} />
          <span className="text-xs text-slate-400 font-medium">
            Step {Math.min(stepIndex + 1, visible.length)} / {visible.length}
          </span>
        </div>
        <div className="max-w-2xl mx-auto mt-3">
          <ProgressBar value={progress} />
        </div>
      </header>

      <section className="px-5 md:px-10 py-8 md:py-14">
        <div className="max-w-2xl mx-auto">
          {showMidFunnel ? (
            <MidFunnel onContinue={() => { setShowMidFunnel(false); setHistory((h)=>[...h, stepIndex]); setStepIndex((i)=>i+1); }} />
          ) : current?.type === "contact" ? (
            <ContactStep
              answers={answers}
              setField={setField}
              submitting={submitting}
              error={error}
              onSubmit={() => submit(answers)}
            />
          ) : current ? (
            <Step
              q={current}
              answers={answers}
              onPick={pickOption}
              onText={setField}
              onAdvance={next}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function MidFunnel({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-blue/10 text-brand-blue text-2xl">
        ✓
      </div>
      <h2 className="mt-4 text-2xl md:text-3xl font-extrabold text-brand-navy">
        You&apos;re doing great.
      </h2>
      <p className="mt-3 text-slate-600">
        Even if you&apos;re not 100% sure of every detail, your answers help us give you a more accurate estimate. Just a few more questions.
      </p>
      <button onClick={onContinue} className="btn-yellow mt-7">
        Continue →
      </button>
    </div>
  );
}

function Step({
  q,
  answers,
  onPick,
  onText,
  onAdvance,
}: {
  q: Question;
  answers: CalculatorAnswers;
  onPick: (field: keyof CalculatorAnswers, value: string) => void;
  onText: (field: keyof CalculatorAnswers, value: string) => void;
  onAdvance: () => void;
}) {
  if (!q.field) return null;
  const value = answers[q.field] ?? "";

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-extrabold text-brand-navy leading-tight">
        {q.question}
      </h2>
      {q.microcopy && (
        <p className="mt-2 text-slate-500">{q.microcopy}</p>
      )}

      {q.type === "single" && q.options && (
        <div className="mt-6 grid gap-3">
          {q.options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`opt ${value === opt ? "border-brand-blue ring-2 ring-brand-blue/20" : ""}`}
              onClick={() => onPick(q.field!, opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {q.type === "text" && (
        <div className="mt-6">
          <input
            type="text"
            inputMode="text"
            placeholder={q.placeholder}
            value={value}
            onChange={(e) => onText(q.field!, e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-200 text-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button onClick={onAdvance} className="btn-yellow mt-5 w-full sm:w-auto">
            Continue →
          </button>
        </div>
      )}

      {q.type === "longtext" && (
        <div className="mt-6">
          <textarea
            placeholder={q.placeholder}
            value={value}
            onChange={(e) => onText(q.field!, e.target.value)}
            rows={5}
            className="w-full p-4 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button onClick={onAdvance} className="btn-yellow mt-5 w-full sm:w-auto">
            Continue →
          </button>
        </div>
      )}

      {q.type === "state" && (
        <div className="mt-6">
          <select
            value={value}
            onChange={(e) => onText(q.field!, e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-200 text-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
          >
            <option value="">Select state…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            disabled={!value}
            onClick={onAdvance}
            className="btn-yellow mt-5 w-full sm:w-auto disabled:opacity-50"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

function ContactStep({
  answers,
  setField,
  submitting,
  error,
  onSubmit,
}: {
  answers: CalculatorAnswers;
  setField: (f: keyof CalculatorAnswers, v: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  const valid =
    !!answers.first_name?.trim() &&
    !!answers.last_name?.trim() &&
    /^[\d\s()+\-.]{7,}$/.test(answers.phone ?? "") &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email ?? "");

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-extrabold text-brand-navy leading-tight">
        You may qualify. Where should we send your estimate?
      </h2>
      <p className="mt-2 text-slate-500">
        We&apos;ll text + email your case value range. A reviewer may also call to discuss your case.
      </p>

      <div className="mt-6 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="First name"
            autoComplete="given-name"
            value={answers.first_name ?? ""}
            onChange={(e) => setField("first_name", e.target.value)}
            className="p-4 rounded-2xl border border-slate-200 text-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <input
            placeholder="Last name"
            autoComplete="family-name"
            value={answers.last_name ?? ""}
            onChange={(e) => setField("last_name", e.target.value)}
            className="p-4 rounded-2xl border border-slate-200 text-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
        <input
          placeholder="Phone"
          inputMode="tel"
          autoComplete="tel"
          value={answers.phone ?? ""}
          onChange={(e) => setField("phone", e.target.value)}
          className="p-4 rounded-2xl border border-slate-200 text-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        <input
          placeholder="Email"
          inputMode="email"
          autoComplete="email"
          value={answers.email ?? ""}
          onChange={(e) => setField("email", e.target.value)}
          className="p-4 rounded-2xl border border-slate-200 text-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <button
        disabled={!valid || submitting}
        onClick={onSubmit}
        className="btn-yellow mt-5 w-full text-lg disabled:opacity-50"
      >
        {submitting ? "Calculating…" : "Calculate My Case Value →"}
      </button>
      <p className="mt-3 text-xs text-slate-400">
        By submitting, you agree to be contacted by phone, SMS, or email about your case. Message and data rates may apply.
      </p>
    </div>
  );
}
