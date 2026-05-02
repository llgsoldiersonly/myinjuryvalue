"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Logo, Tagline } from "./Logo";
import { fireFbq } from "./MetaPixel";
import { AnimatedGradientText } from "./magicui/AnimatedGradientText";
import { ShinyButton } from "./magicui/ShinyButton";
import { Marquee } from "./magicui/Marquee";
import { DotPattern } from "./magicui/DotPattern";
import { BentoGrid, BentoCard } from "./magicui/BentoGrid";
import { cn } from "@/lib/utils";

const TRUST = [
  "Free, no-obligation estimate",
  "Takes about 2 minutes",
  "100% confidential",
  "Used by accident victims nationwide",
  "No commitment required",
  "Talk to a real case reviewer",
];

export function Landing() {
  useEffect(() => {
    fireFbq("ViewContent", { content_category: "landing" });
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <header className="px-5 py-3 md:px-10 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="xl" />
          <Link
            href="/calculator"
            onClick={() => fireFbq("InitiateCheckout", { content_name: "header_check_my_case_value" })}
            className="hidden md:inline-flex text-sm font-semibold text-brand-navy hover:text-brand-blue"
          >
            Check My Case Value →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 md:px-10 pt-10 md:pt-20 pb-12 overflow-hidden">
        <DotPattern
          className={cn(
            "fill-slate-200/70",
            "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
          )}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="inline-block text-xs font-bold tracking-[0.18em] text-brand-blue uppercase mb-4">
            Car Accident Case Value Calculator
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-brand-navy">
            The Insurance company{" "}
            <AnimatedGradientText className="font-extrabold">
              doesn&apos;t care about you.
            </AnimatedGradientText>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-slate-600">
            In about 2 minutes, find out what your accident case may be worth — before you sign anything with insurance.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/calculator"
              onClick={() => fireFbq("InitiateCheckout", { content_name: "hero_check_my_case_value" })}
            >
              <ShinyButton className="btn-yellow text-lg md:text-xl px-7 py-4">
                Check My Case Value →
              </ShinyButton>
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-500">Free. Confidential. No commitment.</p>
        </div>
      </section>

      {/* Trust marquee */}
      <section className="border-y border-slate-100 bg-brand-mist/40 py-3">
        <Marquee speed={45} pauseOnHover gap="2rem">
          {TRUST.map((t) => (
            <span key={t} className="text-sm font-semibold text-brand-navy whitespace-nowrap">
              <span className="text-brand-blue mr-2">✓</span>
              {t}
            </span>
          ))}
        </Marquee>
      </section>

      {/* How it works — bento grid */}
      <section className="px-5 md:px-10 py-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-brand-navy">
            How it works
          </h2>
          <div className="mt-8">
            <BentoGrid>
              <BentoCard
                step="1"
                name="Answer a few questions"
                description="Quick conditional questions about your accident — no legal jargon."
              />
              <BentoCard
                step="2"
                name="Get an instant estimate"
                description="We calculate a personalized case value range based on your answers."
              />
              <BentoCard
                step="3"
                name="Talk to a case reviewer"
                description="If your case looks strong, we connect you with someone right away."
              />
            </BentoGrid>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="calculator" className="relative px-5 md:px-10 py-14 md:py-20 bg-brand-mist overflow-hidden">
        <DotPattern
          className={cn(
            "fill-slate-300/50",
            "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
          )}
        />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-brand-navy">
            Find out what you should be paid.
          </h2>
          <p className="mt-3 text-slate-600">
            Takes about 2 minutes. Most people are surprised by what they see.
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              href="/calculator"
              onClick={() => fireFbq("InitiateCheckout", { content_name: "final_start_my_free_estimate" })}
            >
              <ShinyButton className="btn-yellow text-lg md:text-xl px-7 py-4">
                Start My Free Estimate →
              </ShinyButton>
            </Link>
          </div>
          <div className="mt-10">
            <Tagline className="text-sm" />
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
