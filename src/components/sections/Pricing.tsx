type Plan = {
  name: string;
  price: string;
  cadence: string;
  meta?: string;
  blurb: string;
  features: string[];
  featured?: boolean;
};

type Offering = {
  id: string;
  eyebrow: string;
  title: string;
  blurb: string;
  priceRange: string;
  plans: Plan[];
  cta: { label: string; href: string };
  defaultOpen?: boolean;
};

const offerings: Offering[] = [
  {
    id: "commercial-support",
    eyebrow: "Priced to your turnover",
    title: "Commercial support",
    blurb:
      "Three tiers from a single detailed estimate to dedicated oversight across your pipeline. Understand the true cost of a project before you sign, and keep control of the budget through construction.",
    priceRange: "$1,150 / est – $5,850 / mo",
    defaultOpen: true,
    cta: { label: "View commercial support", href: "/commercial-support" },
    plans: [
      {
        name: "Foundation",
        price: "$1,150",
        cadence: "per estimate",
        meta: "$0 – $800k turnover",
        blurb:
          "$1,500 implementation. Execution quoted upfront, around $3,000 on a $200k build.",
        features: [
          "Detailed trade-by-trade estimate with real supplier pricing",
          "Scope gaps identified before the contract is signed",
          "Purchase orders, procurement planning and cost tracking",
          "Monthly reporting. Fortnightly BuildHawk Huddles.",
        ],
      },
      {
        name: "Growth",
        price: "$2,750",
        cadence: "/ month",
        meta: "$800k – $3M turnover",
        blurb:
          "Per month, one active project. +$1,550 per month per active project, capped at $5,850.",
        features: [
          "Weekly BuildHawk Huddles and variation management",
          "Margin monitoring and cashflow forecasting",
          "Procurement oversight and a dedicated contact",
          "Commercial performance reviewed across every job.",
        ],
        featured: true,
      },
      {
        name: "Performance",
        price: "$5,850",
        cadence: "/ month",
        meta: "$3M – $6M turnover",
        blurb:
          "Supports up to four active projects. Includes up to four estimates a year.",
        features: [
          "Priority estimating turnaround and margin analysis",
          "Dedicated commercial oversight across active projects",
          "Monthly director review and commercial planning",
          "Weekly reporting and business cashflow forecasting.",
        ],
      },
    ],
  },
  {
    id: "peace-of-mind",
    eyebrow: "Buying, not building?",
    title: "Peace of Mind",
    blurb:
      "Independent quote review for homeowners. Before you sign a building contract, we line your builder quotes up apples for apples and flag the gaps.",
    priceRange: "$499 + GST",
    cta: { label: "Learn more", href: "/peace-of-mind" },
    plans: [
      {
        name: "Quote review",
        price: "$499",
        cadence: "+ GST",
        meta: "Fully online · up to 3 quotes",
        blurb:
          "Independent, third-party review of your builder quotes against your plans. Report within 5 business days.",
        features: [
          "Quotes lined up apples for apples",
          "Scope gaps, under-allowances and variation risk flagged",
          "Plain-English report you can take back to your builder",
        ],
      },
    ],
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article
      className={`relative flex flex-col p-6 md:p-7 border transition-colors ${
        plan.featured
          ? "bg-bh-ink text-bh-paper border-bh-ink shadow-[0_30px_60px_-20px_rgba(222,81,35,0.25)]"
          : "bg-bh-white text-bh-black border-bh-steel/60 hover:border-bh-graphite/60"
      }`}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-6 inline-flex items-center h-6 px-2.5 rounded-full bg-bh-orange text-bh-paper text-[10px] tracking-[0.18em] uppercase font-medium">
          Recommended
        </span>
      )}
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <h4
          className={`text-[18px] md:text-[20px] font-medium tracking-[-0.015em] ${
            plan.featured ? "text-bh-paper" : "text-bh-black"
          }`}
        >
          {plan.name}
        </h4>
        {plan.meta && (
          <span
            className={`text-[11px] tracking-[0.04em] uppercase text-right ${
              plan.featured ? "text-bh-steel/80" : "text-bh-graphite"
            }`}
          >
            {plan.meta}
          </span>
        )}
      </div>
      <div className="mb-6">
        <p className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`font-medium tracking-[-0.03em] tabular-nums text-[36px] md:text-[44px] leading-[1] ${
              plan.featured ? "text-bh-orange" : "text-bh-black"
            }`}
          >
            {plan.price}
          </span>
          <span
            className={`text-[12px] tracking-[0.04em] uppercase ${
              plan.featured ? "text-bh-steel/80" : "text-bh-graphite"
            }`}
          >
            {plan.cadence}
          </span>
        </p>
        <p
          className={`mt-3 text-[13px] leading-[1.5] tracking-[-0.005em] ${
            plan.featured ? "text-bh-steel/90" : "text-bh-graphite"
          }`}
        >
          {plan.blurb}
        </p>
      </div>
      <ul className="space-y-2.5">
        {plan.features.map((line) => (
          <li
            key={line}
            className={`flex items-start gap-2.5 text-[13px] leading-[1.45] ${
              plan.featured ? "text-bh-steel" : "text-bh-graphite"
            }`}
          >
            <span className="mt-1.5 inline-block w-1 h-1 rounded-full flex-none bg-bh-orange" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </article>
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
              Every offering in one place. Open the one that fits your situation
              — each quote is tailored after a short brief, so what you pay
              matches the work and the number of jobs in your pipeline.
            </p>
          </div>
        </div>

        {/* Offerings — one dropdown per offering */}
        <div className="border-t border-bh-steel/60">
          {offerings.map((o) => (
            <details
              key={o.id}
              id={o.id}
              name="bh-pricing"
              open={o.defaultOpen}
              className="bh-disclosure group border-b border-bh-steel/60 scroll-mt-24"
            >
              <summary className="flex items-start justify-between gap-6 cursor-pointer list-none py-6 md:py-8 -mx-4 px-4 rounded-[10px] hover:bg-bh-cloud/40 transition-colors duration-200 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-2">
                    {o.eyebrow}
                  </p>
                  <h3 className="text-[24px] md:text-[34px] font-medium tracking-[-0.02em] leading-[1.1] text-bh-black group-hover:text-bh-orange transition-colors">
                    {o.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-[13px] md:text-[15px] leading-[1.55] text-bh-graphite">
                    {o.blurb}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-4 md:gap-6 pt-1">
                  <span className="hidden sm:inline-flex items-center h-7 px-3 rounded-full border border-bh-steel/70 text-[12px] md:text-[13px] font-medium tracking-[-0.01em] tabular-nums text-bh-graphite whitespace-nowrap group-hover:border-bh-orange/60 transition-colors">
                    {o.priceRange}
                  </span>
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full border border-bh-steel/60 text-bh-graphite group-hover:border-bh-orange group-hover:text-bh-orange transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="transition-transform duration-300 group-open:rotate-45"
                    >
                      <path
                        d="M7 1.5v11M1.5 7h11"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>
              </summary>

              <div className="pb-8 md:pb-12">
                {/* price range on mobile, where the summary hides it */}
                <div className="sm:hidden mb-5">
                  <span className="inline-flex items-center h-7 px-3 rounded-full border border-bh-steel/70 text-[12px] font-medium tracking-[-0.01em] tabular-nums text-bh-graphite">
                    {o.priceRange}
                  </span>
                </div>

                <div
                  className={`grid gap-6 grid-cols-1 ${
                    o.plans.length >= 3
                      ? "lg:grid-cols-3"
                      : o.plans.length === 2
                        ? "md:grid-cols-2"
                        : "md:max-w-md"
                  }`}
                >
                  {o.plans.map((plan) => (
                    <PlanCard key={plan.name} plan={plan} />
                  ))}
                </div>

                <a
                  href={o.cta.href}
                  className="mt-7 inline-flex items-center gap-3 rounded-[8px] pl-5 pr-2 h-11 text-[13px] tracking-[-0.005em] font-medium bg-bh-ink text-bh-paper hover:bg-bh-orange transition-colors"
                >
                  {o.cta.label}
                  <span className="inline-flex items-center justify-center rounded-full w-7 h-7 bg-bh-paper/15">
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
              </div>
            </details>
          ))}
        </div>

        {/* Footnote */}
        <div className="mt-10 md:mt-12 grid grid-cols-12 gap-6 md:gap-8">
          <div className="col-span-12 md:col-span-9 md:col-start-4">
            <p className="text-[12px] tracking-[-0.005em] text-bh-graphite leading-[1.5]">
              Indicative starting prices, ex GST. Final pricing is set after a
              short brief so it matches your scope, project count and cadence.
              Payment terms 14 days from invoice. Full conditions in the builder
              terms.
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
      </div>
    </section>
  );
}
