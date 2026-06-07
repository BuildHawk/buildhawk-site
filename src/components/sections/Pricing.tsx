"use client";

import Tilt from "@/components/motion/Tilt";

type Tier = {
  name: string;
  price: string;
  cadence: string;
  note?: string;
  blurb: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
};

type StandardTier = {
  name: string;
  blurb: string;
  annualPrice: string;
  annualCadence: string;
  annualEquiv: string;
  monthlyPrice: string;
  monthlyCadence: string;
  monthlyContext: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
};

type FoundationTier = {
  name: string;
  blurb: string;
  introPrice: string;
  introCadence: string;
  introContext: string;
  futurePrice: string;
  futureCadence: string;
  savings: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
};

const standardTiers: StandardTier[] = [
  {
    name: "Base Execution Layer",
    blurb:
      "For builders running up to two live projects who want pre-construction discipline, procurement coordination and weekly operational cadence.",
    annualPrice: "$35,000",
    annualCadence: "+ GST / year",
    annualEquiv: "Equivalent to ~$2,917 / month",
    monthlyPrice: "$3,450",
    monthlyCadence: "+ GST / month",
    monthlyContext: "$41,400 annually",
    features: [
      "Up to 2 live projects",
      "Pre-construction planning",
      "Procurement support",
      "Purchase Order (PO) management",
      "Weekly operational huddles",
      "Monthly director reporting",
      "Builder-led execution oversight",
      "Access to Hawktress intelligence layer",
      "Estimating as per quote",
    ],
    cta: "Apply for an engagement",
    href: "#intake",
    featured: false,
  },
  {
    name: "Pro Execution Layer",
    blurb:
      "An integrated estimating and execution partner for builders running a consistent pipeline across up to four live projects.",
    annualPrice: "$70,200",
    annualCadence: "+ GST / year",
    annualEquiv: "Equivalent to ~$5,850 / month",
    monthlyPrice: "$6,950",
    monthlyCadence: "+ GST / month",
    monthlyContext: "$83,400 annually",
    features: [
      "Everything in the Base Execution Layer",
      "Up to 4 live projects",
      "Unlimited estimating support across the 4 projects",
      "Priority RFQ processing",
      "Advanced commercial reporting",
      "Margin protection systems",
      "Cashflow and cost-control visibility",
      "Priority execution support",
      "Expanded Hawktress intelligence access",
    ],
    cta: "Apply for an engagement",
    href: "#intake",
    featured: true,
  },
];

const foundationTiers: FoundationTier[] = [
  {
    name: "Foundation Base Member",
    blurb:
      "Founding-cohort rate for the Base Execution Layer. 12-month foundation agreement, locked-in rate for the term.",
    introPrice: "$2,750",
    introCadence: "+ GST / month",
    introContext: "12-month foundation agreement · Introductory founding rate",
    futurePrice: "$3,450",
    futureCadence: "+ GST / month",
    savings: "$8,400+ per year locked in during the foundation term",
    features: [
      "Up to 2 live projects",
      "Full execution layer support",
      "Procurement and PO systems",
      "Director reporting",
      "Weekly operational support",
      "Estimating integration",
      "Hawktress intelligence access",
    ],
    cta: "Apply for foundation membership",
    href: "#intake",
    featured: false,
  },
  {
    name: "Foundation Pro Member",
    blurb:
      "Founding-cohort rate for the Pro Execution Layer. 12-month foundation agreement, locked-in rate for the term.",
    introPrice: "$5,500",
    introCadence: "+ GST / month",
    introContext: "12-month foundation agreement · Introductory founding rate",
    futurePrice: "$6,950",
    futureCadence: "+ GST / month",
    savings: "$17,000+ per year compared to future public pricing",
    features: [
      "Everything in Foundation Base",
      "Up to 4 live projects",
      "Unlimited estimating support across the 4 projects",
      "Priority RFQ allocation",
      "Advanced commercial visibility",
      "Priority support access",
      "Expanded Hawktress intelligence systems",
    ],
    cta: "Apply for foundation membership",
    href: "#intake",
    featured: true,
  },
];

const tradeTiers: Tier[] = [
  {
    name: "Trade Subscription · Base",
    price: "From $149",
    cadence: "+ GST / month",
    blurb:
      "For trades and suppliers wanting smarter project opportunities through a builder-led estimating and execution network.",
    features: [
      "Access to up to 2 quote opportunities per month",
      "Hawktress Intelligence project matching",
      "Connection to builders actively pricing projects",
      "Early visibility on upcoming tender opportunities",
      "Streamlined RFQ communication process",
      "Exposure to BuildHawk builder network",
      "Designed to reduce time chasing unsuitable work",
    ],
    cta: "Join the trade network",
    href: "#intake",
    featured: false,
  },
  {
    name: "Trade Subscription · Pro",
    price: "From $499",
    cadence: "+ GST / month",
    blurb:
      "For trades and suppliers wanting stronger builder exposure, priority opportunities and consistent project flow through the BuildHawk ecosystem.",
    features: [
      "Everything in the Base trade subscription",
      "Access to up to 5 quote opportunities per month",
      "Priority positioning for builder quote requests",
      "First inline access to selected RFQs and tenders",
      "Increased exposure across the BuildHawk network",
      "Hawktress Intelligence opportunity matching",
      "Streamlined communication and quote coordination",
      "Preferred trade network consideration for ongoing projects",
    ],
    cta: "Join the trade network",
    href: "#intake",
    featured: true,
  },
];

function arrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StandardTierCard({ t, i }: { t: StandardTier; i: number }) {
  return (
    <Tilt
      as="article"
      max={3}
      lift={4}
      className={`relative flex flex-col p-6 md:p-7 min-h-[560px] border transition-colors bh-pricing-card ${
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

      <div className="mb-4">
        <p
          className={`text-[10px] tracking-[0.18em] uppercase font-bold mb-1.5 ${
            t.featured ? "text-bh-orange" : "text-bh-orange-700"
          }`}
        >
          Annual Commitment
        </p>
        <p className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`font-medium tracking-[-0.03em] tabular-nums ${
              t.featured ? "text-bh-orange" : "text-bh-black"
            } text-[30px] md:text-[36px] leading-[1]`}
          >
            {t.annualPrice}
          </span>
          <span
            className={`text-[12px] tracking-[0.04em] uppercase ${
              t.featured ? "text-bh-steel/80" : "text-bh-graphite"
            }`}
          >
            {t.annualCadence}
          </span>
        </p>
        <p
          className={`mt-1 text-[11px] ${
            t.featured ? "text-bh-steel/70" : "text-bh-graphite/80"
          }`}
        >
          {t.annualEquiv}
        </p>
      </div>

      <div
        className={`mb-5 pt-3 border-t ${
          t.featured ? "border-bh-paper/15" : "border-bh-steel/60"
        }`}
      >
        <p
          className={`text-[10px] tracking-[0.18em] uppercase font-bold mb-1.5 ${
            t.featured ? "text-bh-steel/70" : "text-bh-graphite"
          }`}
        >
          Monthly Premium Option
        </p>
        <p className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`font-medium tracking-[-0.02em] tabular-nums ${
              t.featured ? "text-bh-paper" : "text-bh-black"
            } text-[20px] md:text-[22px] leading-[1]`}
          >
            {t.monthlyPrice}
          </span>
          <span
            className={`text-[11px] tracking-[0.04em] uppercase ${
              t.featured ? "text-bh-steel/70" : "text-bh-graphite"
            }`}
          >
            {t.monthlyCadence}
          </span>
        </p>
        <p
          className={`mt-1 text-[11px] ${
            t.featured ? "text-bh-steel/60" : "text-bh-graphite/80"
          }`}
        >
          {t.monthlyContext}
        </p>
      </div>

      <p
        className={`text-[13px] leading-[1.5] tracking-[-0.005em] mb-5 ${
          t.featured ? "text-bh-steel/90" : "text-bh-graphite"
        }`}
      >
        {t.blurb}
      </p>

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
          {arrowIcon()}
        </span>
      </a>
    </Tilt>
  );
}

function FoundationTierCard({ t, i }: { t: FoundationTier; i: number }) {
  return (
    <Tilt
      as="article"
      max={3}
      lift={4}
      className={`relative flex flex-col p-6 md:p-7 min-h-[560px] border transition-colors bh-pricing-card ${
        t.featured
          ? "bg-bh-ink text-bh-paper border-bh-ink shadow-[0_30px_60px_-20px_rgba(222,81,35,0.25)]"
          : "bg-bh-white text-bh-black border-bh-steel/60 hover:border-bh-graphite/60"
      }`}
      style={{ animationDelay: `${i * 80}ms` }}
    >
      <span className="absolute -top-3 left-6 inline-flex items-center h-6 px-2.5 rounded-full bg-bh-orange text-bh-paper text-[10px] tracking-[0.18em] uppercase font-medium">
        Foundation rate
      </span>
      <h3
        className={`text-[18px] md:text-[20px] font-medium tracking-[-0.015em] mb-5 mt-3 ${
          t.featured ? "text-bh-paper" : "text-bh-black"
        }`}
      >
        {t.name}
      </h3>

      <div className="mb-4">
        <p
          className={`text-[10px] tracking-[0.18em] uppercase font-bold mb-1.5 ${
            t.featured ? "text-bh-orange" : "text-bh-orange-700"
          }`}
        >
          Introductory Founding Rate
        </p>
        <p className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`font-medium tracking-[-0.03em] tabular-nums ${
              t.featured ? "text-bh-orange" : "text-bh-black"
            } text-[30px] md:text-[36px] leading-[1]`}
          >
            {t.introPrice}
          </span>
          <span
            className={`text-[12px] tracking-[0.04em] uppercase ${
              t.featured ? "text-bh-steel/80" : "text-bh-graphite"
            }`}
          >
            {t.introCadence}
          </span>
        </p>
        <p
          className={`mt-1 text-[11px] ${
            t.featured ? "text-bh-steel/70" : "text-bh-graphite/80"
          }`}
        >
          {t.introContext}
        </p>
      </div>

      <div
        className={`mb-4 pt-3 border-t ${
          t.featured ? "border-bh-paper/15" : "border-bh-steel/60"
        }`}
      >
        <p
          className={`text-[10px] tracking-[0.18em] uppercase font-bold mb-1.5 ${
            t.featured ? "text-bh-steel/70" : "text-bh-graphite"
          }`}
        >
          Standard Future Rate
        </p>
        <p className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`font-medium tracking-[-0.02em] tabular-nums line-through decoration-bh-orange/60 ${
              t.featured ? "text-bh-paper/70" : "text-bh-graphite"
            } text-[20px] md:text-[22px] leading-[1]`}
          >
            {t.futurePrice}
          </span>
          <span
            className={`text-[11px] tracking-[0.04em] uppercase ${
              t.featured ? "text-bh-steel/60" : "text-bh-graphite/70"
            }`}
          >
            {t.futureCadence}
          </span>
        </p>
      </div>

      <div
        className={`mb-5 rounded-md px-3 py-2 text-[12px] leading-[1.4] ${
          t.featured
            ? "bg-bh-orange/20 text-bh-orange-200"
            : "bg-bh-orange-50/70 text-bh-orange-700"
        }`}
      >
        <span className="font-bold">Founding savings:</span> {t.savings}
      </div>

      <p
        className={`text-[13px] leading-[1.5] tracking-[-0.005em] mb-5 ${
          t.featured ? "text-bh-steel/90" : "text-bh-graphite"
        }`}
      >
        {t.blurb}
      </p>

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
          {arrowIcon()}
        </span>
      </a>
    </Tilt>
  );
}

function TierCard({ t, i }: { t: Tier; i: number }) {
  return (
    <Tilt
      as="article"
      max={3}
      lift={4}
      className={`relative flex flex-col p-6 md:p-7 min-h-[460px] border transition-colors bh-pricing-card ${
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
            } text-[34px] md:text-[40px] leading-[1]`}
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
        {t.note && (
          <p
            className={`mt-2 text-[11px] tracking-[0.04em] uppercase ${
              t.featured ? "text-bh-steel/70" : "text-bh-graphite/80"
            }`}
          >
            {t.note}
          </p>
        )}
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
          {arrowIcon()}
        </span>
      </a>
    </Tilt>
  );
}

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
              Two execution layers for builders, with annual or monthly options.
              Foundation member rates are available to the first cohort of
              builders on a 12-month agreement. Every engagement is shaped after
              a short brief.
            </p>
          </div>
        </div>

        {/* Standard execution-layer pricing */}
        <div className="mb-10 md:mb-14">
          <div className="mb-5 md:mb-7 flex items-baseline gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-bh-orange" />
            <h3 className="text-[14px] tracking-[0.18em] uppercase text-bh-black font-medium">
              For builders · Standard pricing
            </h3>
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 bh-pricing-grid">
            {standardTiers.map((t, i) => (
              <StandardTierCard key={t.name} t={t} i={i} />
            ))}
          </div>
        </div>

        {/* Foundation member pricing */}
        <div className="mb-10 md:mb-14">
          <div className="mb-5 md:mb-7 flex items-baseline gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-bh-orange" />
            <h3 className="text-[14px] tracking-[0.18em] uppercase text-bh-black font-medium">
              For builders · Foundation member rates
            </h3>
          </div>
          <p className="mb-5 max-w-2xl text-[13px] leading-[1.55] text-bh-graphite">
            Limited founding-cohort rates for builders on a 12-month foundation
            agreement. Locked in for the term, with the standard rate applying
            at renewal.
          </p>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 bh-pricing-grid">
            {foundationTiers.map((t, i) => (
              <FoundationTierCard key={t.name} t={t} i={i} />
            ))}
          </div>
        </div>

        {/* Trade pricing group */}
        <div className="mb-10 md:mb-14">
          <div className="mb-5 md:mb-7 flex items-baseline gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-bh-orange" />
            <h3 className="text-[14px] tracking-[0.18em] uppercase text-bh-black font-medium">
              For trades and suppliers
            </h3>
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 bh-pricing-grid">
            {tradeTiers.map((t, i) => (
              <TierCard key={t.name} t={t} i={i} />
            ))}
          </div>
        </div>

        {/* Hawktress Alliance */}
        <div className="mb-10 md:mb-14">
          <div className="mb-5 md:mb-7 flex items-baseline gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-bh-orange" />
            <h3 className="text-[14px] tracking-[0.18em] uppercase text-bh-black font-medium">
              For supplier partners
            </h3>
          </div>
          <article className="relative flex flex-col md:flex-row gap-6 md:gap-10 p-6 md:p-10 border border-bh-steel/60 bg-bh-white">
            <div className="md:w-1/3">
              <p className="text-[11px] tracking-[0.18em] uppercase text-bh-graphite font-medium">
                Hawktress Alliance
              </p>
              <p className="mt-2 text-[28px] md:text-[34px] font-medium tracking-[-0.02em] leading-[1.05] text-bh-black">
                Complimentary supplier listing.
              </p>
              <p className="mt-3 text-[13px] leading-[1.55] tracking-[-0.005em] text-bh-graphite">
                A connected supplier and builder ecosystem focused on better
                procurement visibility, stronger estimating accuracy, improved
                project coordination, and long-term industry alignment. Not a
                supplier directory: a strategic alliance designed to support
                builders operating within the BuildHawk execution ecosystem.
              </p>
              <a
                href="/partners"
                className="mt-5 inline-flex items-center justify-between gap-4 rounded-[8px] pl-5 pr-2 h-11 text-[13px] tracking-[-0.005em] font-medium bg-bh-ink text-bh-paper hover:bg-bh-orange transition-colors"
              >
                Apply for Alliance listing
                <span className="inline-flex items-center justify-center rounded-full w-7 h-7 bg-bh-paper/15">
                  {arrowIcon()}
                </span>
              </a>
            </div>
            <div className="md:w-1/3">
              <p className="text-[12px] tracking-[0.04em] uppercase text-bh-graphite font-medium">
                What is included
              </p>
              <ul className="mt-3 space-y-2.5">
                {[
                  "Supplier listing within the Hawktress Alliance network",
                  "Exposure to builders operating within the BuildHawk + Hawktress ecosystem",
                  "Inclusion in relevant procurement, estimating and RFQ workflows",
                  "Opportunity to showcase products, systems and supply capabilities to active building companies",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-[13px] leading-[1.45] text-bh-graphite"
                  >
                    <span className="mt-1.5 inline-block w-1 h-1 rounded-full flex-none bg-bh-orange" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/3">
              <p className="text-[12px] tracking-[0.04em] uppercase text-bh-graphite font-medium">
                Alliance requirements
              </p>
              <ul className="mt-3 space-y-2.5">
                {[
                  "Provide current pricing catalogues and product information",
                  "Maintain accurate lead times, supply capabilities and quotation responsiveness",
                  "Support the BuildHawk and Hawktress ecosystem through collaborative engagement",
                  "Include the Hawktress Alliance within broader marketing and partnership activity where reasonably applicable",
                  "Participate in aligned co-branded campaigns, supplier features or ecosystem promotion opportunities",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-[13px] leading-[1.45] text-bh-graphite"
                  >
                    <span className="mt-1.5 inline-block w-1 h-1 rounded-full flex-none bg-bh-orange" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
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
              All prices shown ex GST. Final terms are set after a short brief
              so the engagement matches your scope, project count and cadence.
              Foundation rates require a 12-month agreement. Payment terms 14
              days from invoice. Full conditions in the builder, trade and
              supplier terms.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px] tracking-[-0.005em]">
              <a
                href="/terms-builders"
                className="text-bh-orange hover:text-bh-orange-700 underline underline-offset-4"
              >
                Builder terms
              </a>
              <a
                href="/terms-trades"
                className="text-bh-orange hover:text-bh-orange-700 underline underline-offset-4"
              >
                Trade terms
              </a>
              <a
                href="/terms-suppliers"
                className="text-bh-orange hover:text-bh-orange-700 underline underline-offset-4"
              >
                Supplier terms
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
