"use client";

import Tilt from "@/components/motion/Tilt";

type Tier = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
};

const tiers: Tier[] = [
  {
    name: "Base",
    price: "From $2,750",
    cadence: "/ month",
    blurb: "For builders running one or two live projects who want a precise estimating partner without committing to a full annual workspace.",
    features: [
      "Estimating tailored to the scope you bring",
      "Margin and cost tracking through delivery",
      "Brief to handover, run with our team",
    ],
    cta: "Start a brief",
    href: "#intake",
    featured: false,
  },
  {
    name: "Unlimited",
    price: "From $5,850",
    cadence: "/ month",
    blurb: "Up to 4 active jobs at a time. Built for builders with consistent pipeline who want a fixed monthly cost and a back-office team that flexes with the work.",
    features: [
      "Up to 4 active projects",
      "Estimating, CA and live margin tracking",
      "Priority response and rolling planning cadence",
    ],
    cta: "Talk to us",
    href: "#intake",
    featured: true,
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative bg-bh-white py-16 md:py-36 scroll-mt-20"
    >
      <div className="mx-auto max-w-[1480px] px-5 md:px-10">
        {/* Header */}
        <div className="grid grid-cols-12 gap-6 md:gap-8 mb-8 md:mb-14">
          <div className="col-span-12 md:col-span-3">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite">
              Pricing
            </p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[32px] sm:text-[40px] md:text-[56px] lg:text-[72px] text-bh-black">
              Built around your build.
              <br />
              <span className="text-bh-graphite">Priced around your scope.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-[14px] md:text-[17px] leading-[1.5] tracking-[-0.005em] text-bh-graphite">
              Two simple starting points. Every quote is tailored after a short
              brief, so what you pay matches the work and the number of jobs in
              your pipeline.
            </p>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 bh-pricing-grid">
          {tiers.map((t, i) => (
            <Tilt
              as="article"
              key={t.name}
              max={3}
              lift={4}
              className={`relative flex flex-col p-6 md:p-7 min-h-[420px] border transition-colors bh-pricing-card ${
                t.featured
                  ? "bg-bh-ink text-bh-paper border-bh-ink shadow-[0_30px_60px_-20px_rgba(222,81,35,0.25)]"
                  : "bg-bh-white text-bh-black border-bh-steel/60 hover:border-bh-graphite/60"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {t.featured && (
                <span className="absolute -top-3 left-6 inline-flex items-center h-6 px-2.5 rounded-full bg-bh-orange text-bh-paper text-[10px] tracking-[0.18em] uppercase font-medium">
                  Recommended
                </span>
              )}
              <h3
                className={`text-[18px] md:text-[20px] font-medium tracking-[-0.015em] mb-5 ${
                  t.featured ? "text-bh-paper" : "text-bh-black"
                }`}
              >
                {t.name}
              </h3>
              <div className="mb-6">
                <p className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className={`font-medium tracking-[-0.03em] tabular-nums ${
                      t.featured ? "text-bh-orange" : "text-bh-black"
                    } text-[40px] md:text-[48px] leading-[1]`}
                  >
                    {t.price}
                  </span>
                  <span
                    className={`text-[12px] tracking-[0.04em] uppercase ${
                      t.featured ? "text-bh-steel/80" : "text-bh-graphite"
                    }`}
                  >
                    {t.cadence}
                  </span>
                </p>
                <p
                  className={`mt-3 text-[13px] leading-[1.5] tracking-[-0.005em] ${
                    t.featured ? "text-bh-steel/90" : "text-bh-graphite"
                  }`}
                >
                  {t.blurb}
                </p>
              </div>

              <ul className="space-y-2.5 mb-8">
                {t.features.map((line) => (
                  <li
                    key={line}
                    className={`flex items-start gap-2.5 text-[13px] leading-[1.45] ${
                      t.featured ? "text-bh-steel" : "text-bh-graphite"
                    }`}
                  >
                    <span className="mt-1.5 inline-block w-1 h-1 rounded-full flex-none bg-bh-orange" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <a
                href={t.href}
                className={`mt-auto inline-flex items-center justify-between gap-4 rounded-[8px] pl-5 pr-2 h-11 text-[13px] tracking-[-0.005em] font-medium transition-colors ${
                  t.featured
                    ? "bg-bh-orange text-bh-paper hover:bg-bh-orange-700"
                    : "bg-bh-ink text-bh-paper hover:bg-bh-orange"
                }`}
              >
                {t.cta}
                <span
                  className={`inline-flex items-center justify-center rounded-full w-7 h-7 ${
                    t.featured ? "bg-bh-paper/20" : "bg-bh-paper/15"
                  }`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </a>
            </Tilt>
          ))}
        </div>

        {/* Builder callout: full Commercial Support structure */}
        <a
          href="/commercial-support"
          className="group mt-8 md:mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-[10px] bg-bh-ink text-bh-paper p-6 md:p-8 transition-shadow hover:shadow-[0_24px_50px_-24px_rgba(222,81,35,0.45)]"
        >
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-2">
              Priced to your turnover
            </p>
            <p className="text-[18px] md:text-[22px] font-medium tracking-[-0.015em] text-bh-paper leading-[1.25]">
              Commercial support, built around every active project.
            </p>
            <p className="mt-2 text-[13px] md:text-[14px] leading-[1.5] text-bh-steel max-w-xl">
              See the full structure: three tiers from a single detailed
              estimate to dedicated oversight across your pipeline. Foundation,
              Growth and Performance.
            </p>
          </div>
          <span className="inline-flex flex-none items-center gap-3 rounded-[8px] pl-5 pr-2 h-11 text-[13px] tracking-[-0.005em] font-medium bg-bh-orange text-bh-paper group-hover:bg-bh-orange-700 transition-colors">
            View commercial support
            <span className="inline-flex items-center justify-center rounded-full w-7 h-7 bg-bh-paper/20">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
        </a>

        {/* Footnote */}
        <div className="mt-10 md:mt-12 grid grid-cols-12 gap-6 md:gap-8">
          <div className="col-span-12 md:col-span-9 md:col-start-4">
            <p className="text-[12px] tracking-[-0.005em] text-bh-graphite leading-[1.5]">
              Indicative starting prices, ex GST. Final pricing is set after a
              short brief so it matches your scope, project count and cadence.
              Payment terms 14 days from invoice. Full conditions in the
              builder terms.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px] tracking-[-0.005em]">
              <a
                href="/terms-builders"
                className="text-bh-orange hover:text-bh-orange-700 underline underline-offset-4"
              >
                Builder terms
              </a>
              <a
                href="/data-policy"
                className="text-bh-orange hover:text-bh-orange-700 underline underline-offset-4"
              >
                Data policy
              </a>
            </div>
          </div>
        </div>

        {/* Homeowner callout: Peace of Mind quote review */}
        <a
          href="/peace-of-mind"
          className="group mt-10 md:mt-14 flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-[10px] border border-bh-steel/60 bg-bh-cloud p-6 md:p-8 hover:border-bh-orange transition-colors"
        >
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-2">
              Buying, not building?
            </p>
            <p className="text-[18px] md:text-[22px] font-medium tracking-[-0.015em] text-bh-black leading-[1.25]">
              Peace of Mind: independent quote review for homeowners.
            </p>
            <p className="mt-2 text-[13px] md:text-[14px] leading-[1.5] text-bh-graphite max-w-xl">
              Before you sign a building contract, we line your builder quotes
              up apples for apples and flag the gaps. $499 + GST, fully online.
            </p>
          </div>
          <span className="inline-flex flex-none items-center gap-3 rounded-[8px] pl-5 pr-2 h-11 text-[13px] tracking-[-0.005em] font-medium bg-bh-ink text-bh-paper group-hover:bg-bh-orange transition-colors">
            Learn more
            <span className="inline-flex items-center justify-center rounded-full w-7 h-7 bg-bh-paper/15">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
        </a>
      </div>
    </section>
  );
}
