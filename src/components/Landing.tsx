"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Logo, Tagline } from "./Logo";
import { fireFbq } from "./MetaPixel";

const TRUST = [
  "Free, no-obligation estimate",
  "Takes about 2 minutes",
  "100% confidential",
  "Used by accident victims nationwide",
];

export function Landing() {
  useEffect(() => {
    // ViewContent fires when the calculator-intent landing renders.
    // The actual calculator-start ViewContent will also fire on /calculator.
    fireFbq("ViewContent", { content_category: "landing" });
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <header className="px-5 py-4 md:px-10 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <a
            href="#calculator"
            className="hidden md:inline-flex text-sm font-semibold text-brand-navy hover:text-brand-blue"
          >
            Check My Case Value →
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 md:px-10 pt-10 md:pt-20 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="inline-block text-xs font-bold tracking-[0.18em] text-brand-blue uppercase mb-4">
            Car Accident Case Value Calculator
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-brand-navy">
            The insurance company <span className="text-brand-blue">doesn&apos;t care about you.</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-slate-600">
            In about 2 minutes, find out what your accident case may be worth — before you sign anything with insurance.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/calculator"
              className="btn-yellow text-lg md:text-xl px-7 py-4"
              onClick={() => fireFbq("ViewContent", { content_category: "calculator_start" })}
            >
              Check My Case Value →
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-500">Free. Confidential. No commitment.</p>

          {/* trust chips */}
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {TRUST.map((t) => (
              <li
                key={t}
                className="text-sm font-semibold bg-brand-mist text-brand-navy rounded-full px-3 py-1 border border-slate-200"
              >
                ✓ {t}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Tagline className="text-sm md:text-base" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 md:px-10 py-12 bg-brand-mist">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-brand-navy">
            How it works
          </h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              ["1", "Answer a few questions", "Quick conditional questions about your accident — no legal jargon."],
              ["2", "Get an instant estimate", "We calculate a personalized case value range based on your answers."],
              ["3", "Talk to a case reviewer", "If your case looks strong, we connect you with someone right away."],
            ].map(([n, h, d]) => (
              <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200">
                <div className="w-9 h-9 rounded-full bg-brand-blue text-white grid place-items-center font-bold">
                  {n}
                </div>
                <h3 className="mt-3 font-bold text-brand-navy">{h}</h3>
                <p className="text-sm text-slate-600 mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator anchor / final CTA */}
      <section id="calculator" className="px-5 md:px-10 py-14 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-brand-navy">
            Find out what you should be paid.
          </h2>
          <p className="mt-3 text-slate-600">
            Takes about 2 minutes. Most people are surprised by what they see.
          </p>
          <div className="mt-7">
            <Link
              href="/calculator"
              className="btn-yellow text-lg md:text-xl px-7 py-4"
              onClick={() => fireFbq("ViewContent", { content_category: "calculator_start_cta" })}
            >
              Start My Free Estimate →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-5 md:px-10 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-slate-500">
          <Logo size="sm" />
          <p>
            © {new Date().getFullYear()} MyInjuryValue.com — Estimates are not a guarantee. This is not legal advice.
          </p>
        </div>
      </footer>
    </main>
  );
}
