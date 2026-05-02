import Link from "next/link";
import { Logo, Tagline } from "@/components/Logo";
import { supabaseAdmin } from "@/lib/supabase";
import { formatUsd } from "@/lib/scoring";

export const dynamic = "force-dynamic";

const QUALITY_COPY: Record<string, { headline: string; sub: string }> = {
  HIGH_VALUE: {
    headline: "Your case looks strong.",
    sub: "Don't sign anything with insurance until you talk to someone.",
  },
  HOT: {
    headline: "Your case may be worth more than you think.",
    sub: "A case reviewer will reach out shortly.",
  },
  GOOD: {
    headline: "You may have a real case.",
    sub: "We'll be in touch to walk through your options.",
  },
  REVIEW: {
    headline: "Your case is worth a second look.",
    sub: "Some of your answers suggest more value than insurance is letting on.",
  },
  URGENT_REVIEW: {
    headline: "Your case needs urgent review.",
    sub: "Based on your answers, please don't sign anything else until we talk.",
  },
  LOW: {
    headline: "We'll send you your estimate.",
    sub: "Most people are surprised by what's actually owed — we'll review and follow up.",
  },
};

export default async function ResultPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const id = searchParams.id;
  if (!id) {
    return (
      <Fallback
        headline="We couldn't find your estimate"
        sub="Try the calculator again to get your case value."
      />
    );
  }

  const sb = supabaseAdmin();
  const { data: lead } = await sb
    .from("case_calculator_leads")
    .select("first_name,value_min,value_max,lead_quality")
    .eq("id", id)
    .maybeSingle();

  if (!lead) {
    return (
      <Fallback
        headline="We couldn't find your estimate"
        sub="Try the calculator again to get your case value."
      />
    );
  }

  const copy = QUALITY_COPY[lead.lead_quality as string] ?? QUALITY_COPY.REVIEW;
  const range = `${formatUsd(lead.value_min ?? 0)} – ${formatUsd(lead.value_max ?? 0)}`;

  return (
    <main className="min-h-screen bg-white">
      <header className="px-5 py-4 md:px-10 border-b border-slate-100">
        <div className="max-w-3xl mx-auto"><Logo size="md" /></div>
      </header>
      <section className="px-5 md:px-10 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-brand-blue">
            Estimated case value
          </p>
          <h1 className="mt-2 text-3xl md:text-5xl font-extrabold text-brand-navy">
            {copy.headline}
          </h1>
          <p className="mt-3 text-slate-600">{copy.sub}</p>

          <div className="mt-8 bg-brand-navy text-white rounded-3xl p-8 md:p-10">
            <p className="text-sm uppercase tracking-widest text-brand-blueLight">
              Your range, {lead.first_name ?? "friend"}
            </p>
            <p className="mt-3 text-3xl md:text-5xl font-extrabold">{range}</p>
            <p className="mt-3 text-slate-300 text-sm">
              Estimate based on your answers. Not a guarantee.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-3 text-left">
            <div className="bg-brand-mist rounded-2xl p-4 border border-slate-200">
              <p className="font-bold text-brand-navy">📞 We&apos;ll call you shortly</p>
              <p className="text-sm text-slate-600 mt-1">
                A case reviewer is being notified now and will be in touch.
              </p>
            </div>
            <div className="bg-brand-mist rounded-2xl p-4 border border-slate-200">
              <p className="font-bold text-brand-navy">📧 Check your email</p>
              <p className="text-sm text-slate-600 mt-1">
                Your full estimate is also being sent to your inbox.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Tagline className="text-sm" />
          </div>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-semibold text-brand-blue hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}

function Fallback({ headline, sub }: { headline: string; sub: string }) {
  return (
    <main className="min-h-screen bg-white grid place-items-center px-5">
      <div className="text-center">
        <Logo size="md" />
        <h1 className="mt-6 text-2xl font-extrabold text-brand-navy">{headline}</h1>
        <p className="mt-2 text-slate-600">{sub}</p>
        <Link href="/calculator" className="btn-yellow mt-6 inline-flex">
          Start calculator →
        </Link>
      </div>
    </main>
  );
}
