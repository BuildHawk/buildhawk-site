import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Commercial Support for Residential Builders · BuildHawk",
  description:
    "Commercial support for residential builders. Understand the true cost of a project before you sign, and keep control of the budget through construction. Three tiers priced to your turnover. Precision Estimating. Disciplined Delivery.",
  alternates: {
    canonical: "/commercial-support",
  },
  openGraph: {
    type: "website",
    title: "Commercial Support for Residential Builders",
    description:
      "Three tiers of commercial support, from a single detailed estimate to dedicated oversight across every active project. Priced to your turnover.",
    url: "/commercial-support",
  },
};

const CONTACT_EMAIL = "info@buildhawk.com.au";
const ENQUIRE_MAILTO = `mailto:${CONTACT_EMAIL}?subject=Commercial%20Support%20enquiry`;

type Tier = {
  id: string;
  idx: string;
  name: string;
  turnover: string;
  amount: string;
  unit: string;
  detail: string;
  features: string[];
  featured?: boolean;
};

const tiers: Tier[] = [
  {
    id: "foundation",
    idx: "01 / 03",
    name: "Foundation",
    turnover: "$0 – $800k turnover",
    amount: "$1,150",
    unit: "per estimate",
    detail:
      "$1,500 implementation. Execution quoted upfront, around $3,000 on a $200k build.",
    features: [
      "Detailed trade-by-trade estimate with real supplier pricing",
      "Scope gaps identified before the contract is signed",
      "Purchase orders, procurement planning and cost tracking",
      "Monthly reporting. Fortnightly BuildHawk Huddles.",
    ],
  },
  {
    id: "growth",
    idx: "02 / 03",
    name: "Growth",
    turnover: "$800k – $3M turnover",
    amount: "$2,750",
    unit: "per month, one active project",
    detail: "+$1,550 per month per active project, capped at $5,850.",
    features: [
      "Weekly BuildHawk Huddles and variation management",
      "Margin monitoring and cashflow forecasting",
      "Procurement oversight and a dedicated contact",
      "Commercial performance reviewed across every job.",
    ],
    featured: true,
  },
  {
    id: "performance",
    idx: "03 / 03",
    name: "Performance",
    turnover: "$3M – $6M turnover",
    amount: "$5,850",
    unit: "per month",
    detail:
      "Supports up to four active projects. Includes up to four estimates a year.",
    features: [
      "Priority estimating turnaround and margin analysis",
      "Dedicated commercial oversight across active projects",
      "Monthly director review and commercial planning",
      "Weekly reporting and business cashflow forecasting.",
    ],
  },
];

export default function CommercialSupportPage() {
  return (
    <main className="relative bg-bh-white text-bh-black">
      <Nav />

      {/* Hero */}
      <section className="pt-32 md:pt-44 pb-12 md:pb-16">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-6 md:gap-8">
            <div className="col-span-12 md:col-span-3">
              <p className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.2em] uppercase text-bh-orange">
                <span className="inline-block w-3 h-px bg-bh-orange" />
                Commercial Support · 2026
              </p>
              <p className="mt-2 text-[13px] tracking-[-0.005em] text-bh-graphite">
                For residential builders
              </p>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h1 className="font-medium tracking-[-0.03em] leading-[1.0] text-[40px] md:text-[60px] lg:text-[76px] text-bh-black">
                You build.
                <br />
                <span className="text-bh-orange">
                  We help protect the margin.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] md:text-[19px] leading-[1.5] tracking-[-0.005em] text-bh-graphite">
                Commercial support for residential builders. Understand the true
                cost of a project before you sign, and keep control of the
                budget through construction.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {tiers.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className="inline-flex items-center h-11 px-5 rounded-[8px] border border-bh-steel/60 text-bh-black text-[13px] tracking-[-0.005em] hover:border-bh-orange hover:text-bh-orange transition-colors"
                  >
                    {t.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 md:py-20 border-y border-bh-steel/40">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-6 md:gap-12 mb-10 md:mb-14">
            <div className="col-span-12 md:col-span-5">
              <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-3">
                Pricing · 2026
              </p>
              <h2 className="font-medium tracking-[-0.02em] text-[28px] md:text-[40px] leading-[1.05] text-bh-black">
                Priced to your turnover.
                <br />
                <span className="text-bh-graphite">
                  Built to protect your numbers.
                </span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-7 flex md:items-end">
              <p className="text-[15px] md:text-[16px] leading-[1.5] text-bh-graphite max-w-xl">
                Three tiers of commercial support, from a single detailed
                estimate to dedicated oversight across every active project.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 items-start">
            {tiers.map((t) => (
              <article
                key={t.id}
                id={t.id}
                className={`scroll-mt-28 flex flex-col h-full rounded-[14px] p-7 md:p-8 ${
                  t.featured
                    ? "bg-bh-ink text-bh-paper lg:-translate-y-4"
                    : "bg-bh-cloud border border-bh-steel/60"
                }`}
              >
                <p className="font-mono text-[13px] tracking-[0.05em] text-bh-orange">
                  {t.idx}
                </p>
                <h3
                  className={`mt-2 font-medium tracking-[-0.02em] text-[32px] md:text-[38px] leading-none ${
                    t.featured ? "text-bh-paper" : "text-bh-black"
                  }`}
                >
                  {t.name}
                </h3>
                <span
                  className={`inline-block mt-4 self-start text-[12px] tracking-[-0.005em] px-3.5 py-1.5 rounded-full border ${
                    t.featured
                      ? "border-bh-paper/25 text-bh-paper"
                      : "border-bh-steel/70 text-bh-black"
                  }`}
                >
                  {t.turnover}
                </span>

                <p className="mt-7 flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium tracking-[-0.03em] tabular-nums text-bh-orange text-[44px] md:text-[52px] leading-[0.95]">
                    {t.amount}
                  </span>
                  <span
                    className={`text-[14px] font-medium ${
                      t.featured ? "text-bh-steel" : "text-bh-graphite"
                    }`}
                  >
                    {t.unit}
                  </span>
                </p>
                <p
                  className={`mt-3 text-[14px] leading-[1.5] ${
                    t.featured ? "text-bh-steel" : "text-bh-graphite"
                  }`}
                >
                  {t.detail}
                </p>

                <span
                  className={`block h-px my-6 ${
                    t.featured ? "bg-bh-paper/15" : "bg-bh-steel/60"
                  }`}
                />

                <ul className="flex flex-col gap-4">
                  {t.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-3 text-[15px] leading-[1.4] ${
                        t.featured ? "text-bh-paper" : "text-bh-black"
                      }`}
                    >
                      <span className="mt-[9px] inline-block w-3 h-px flex-none bg-bh-orange" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={ENQUIRE_MAILTO}
                  className="mt-7 inline-flex items-center gap-2 text-[12px] tracking-[0.06em] uppercase font-medium text-bh-orange hover:gap-3 transition-all"
                >
                  Enquire
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </article>
            ))}
          </div>

          {/* Homeowner callout: Peace of Mind quote review */}
          <a
            href="/peace-of-mind"
            className="group mt-10 md:mt-14 flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-[14px] border border-bh-steel/60 bg-bh-cloud p-6 md:p-8 hover:border-bh-orange transition-colors"
          >
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-2">
                Buying, not building?
              </p>
              <p className="text-[18px] md:text-[22px] font-medium tracking-[-0.015em] text-bh-black leading-[1.25]">
                Peace of Mind: independent quote review for homeowners.
              </p>
              <p className="mt-2 text-[13px] md:text-[14px] leading-[1.5] text-bh-graphite max-w-xl">
                Not a builder? If you are comparing builder quotes before you
                sign, we line them up apples for apples and flag the gaps.
                $499 + GST, fully online.
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

      {/* We stay involved */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <span className="inline-block w-11 h-[3px] bg-bh-orange mb-6" />
          <div className="grid grid-cols-12 gap-6 md:gap-8 items-end">
            <div className="col-span-12 md:col-span-8">
              <h2 className="font-medium tracking-[-0.025em] text-[32px] md:text-[52px] leading-[1.04] text-bh-black">
                Most estimators stop at the estimate.
                <br />
                <span className="text-bh-orange">We stay involved.</span>
              </h2>
              <p className="mt-6 max-w-2xl text-[16px] md:text-[18px] leading-[1.55] text-bh-graphite">
                From estimate through to handover, we help you make better
                commercial decisions and keep control of the numbers. Tell us
                your annual turnover and we will price the right tier.
              </p>
            </div>
            <div className="col-span-12 md:col-span-4 flex md:justify-end">
              <a
                href={ENQUIRE_MAILTO}
                className="inline-flex items-center justify-between gap-4 rounded-[8px] pl-6 pr-2 h-12 text-[14px] tracking-[-0.005em] font-medium bg-bh-orange text-bh-paper hover:bg-bh-orange-700 transition-colors"
              >
                Get a quote
                <span className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-bh-paper/20">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
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
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-bh-ink text-bh-paper pb-16 border-t border-bh-paper/10">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10 pt-12">
          <p className="text-[11px] tracking-[0.28em] uppercase text-bh-orange">
            Precision Estimating. Disciplined Delivery.
          </p>
          <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <p className="text-[14px] tracking-[-0.005em] text-bh-steel/80">
              © {new Date().getFullYear()} BuildHawk Pty Ltd · Geelong, VIC ·
              ACN 695 023 664
            </p>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-3" aria-label="Footer">
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">{CONTACT_EMAIL}</a>
              <a href="/peace-of-mind" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">Peace of Mind</a>
              <a href="/faq" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">FAQ</a>
              <a href="/" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">← Back to BuildHawk</a>
            </nav>
          </div>
        </div>
        <div className="h-3 md:h-4 bg-bh-orange mt-12" />
      </footer>
    </main>
  );
}
