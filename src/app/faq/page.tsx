import Link from "next/link";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "FAQ · BuildHawk",
  description:
    "Common questions about BuildHawk's contract administration, estimating and the Hawktress™ cost intelligence platform.",
};

type Faq = {
  q: string;
  a: string[];
};

type Section = {
  id: string;
  label: string;
  title: string;
  blurb: string;
  items: Faq[];
};

const sections: Section[] = [
  {
    id: "buildhawk",
    label: "About BuildHawk",
    title: "BuildHawk, in plain terms.",
    blurb:
      "Who we are, what we do, and how the engagement is structured for residential builders in Australia.",
    items: [
      {
        q: "What does BuildHawk actually do?",
        a: [
          "We run estimating and contract administration for custom residential builders. That means three things: we price the job before it goes under contract, we monitor cost against estimate every month it's on the tools, and we produce a single director-level report that tells the builder if the business is on track.",
          "We are not a software company that bolts on services. We are a contract administration practice that built the software we needed. Hawktress™ is the cost intelligence layer that sits behind every estimate.",
        ],
      },
      {
        q: "Who is BuildHawk for?",
        a: [
          "Custom residential builders in Australia running between 4 and 30 active jobs at any time. The methodology applies across knockdown rebuilds, custom new builds and substantial renovations on contracts between $600k and $4m.",
          "Builders who want a final account that matches their estimate. Builders who already lost money on a sitework variation and never want to repeat it.",
        ],
      },
      {
        q: "Where are you based?",
        a: [
          "Geelong, Victoria. We work with builders across Geelong, the Bellarine Peninsula, the Surf Coast and the western Melbourne fringe. Engagements outside Victoria are case-by-case.",
        ],
      },
      {
        q: "Who runs BuildHawk?",
        a: [
          "Nathan Holloway founded BuildHawk after two decades estimating and administering contracts on Australian residential jobs. John Ceballos heads operations. The team sits between the builder, the trades and the client — without being any of them.",
        ],
      },
    ],
  },
  {
    id: "engagement",
    label: "Engagement & Pricing",
    title: "How an engagement runs.",
    blurb:
      "Onboarding, deliverables, fees, and what changes inside the business in the first 90 days.",
    items: [
      {
        q: "How does an engagement start?",
        a: [
          "A 30-minute discovery call. We look at three things: contract structure across the active book, last twelve months of variations, and how cost is currently tracked between estimate and final account. If the methodology is going to add more than its fee, we say so. If it is not, we say that too.",
          "From there, onboarding takes 14 days. By day 15 the first monthly director report lands.",
        ],
      },
      {
        q: "What is included in the monthly fee?",
        a: [
          "Cost monitoring across every active job. The 5% variance threshold flagging system. The monthly director report by the 5th of every month. Variation pricing review on every contract change. Trade package estimating for new contracts entering the book during the engagement.",
        ],
      },
      {
        q: "What does it cost?",
        a: [
          "We publish three engagement tiers on the pricing page. Pricing scales with the active book size — the number of jobs we monitor and the volume of estimating produced. Most builders engage on a 12-month minimum so the methodology has time to compound across at least two full project cycles.",
        ],
      },
      {
        q: "Can I trial it on a single job?",
        a: [
          "No. The methodology only works when applied across the whole active book. A single job in a system that is otherwise unchanged tells you nothing about whether the engagement is working. We need to see the variance trend across at least four jobs to demonstrate value.",
        ],
      },
      {
        q: "Do you replace my contract administrator?",
        a: [
          "No. We replace the spreadsheet and the gut feel. Your CA still runs the job day to day. We give them a cost framework that flags problems while they can still be solved, and a reporting cadence that protects them from being blamed for things they could not see.",
        ],
      },
    ],
  },
  {
    id: "methodology",
    label: "Methodology",
    title: "The cost control system.",
    blurb:
      "The 5% variance threshold, the monthly director report, and the discipline that holds it together.",
    items: [
      {
        q: "What is the 5% variance threshold?",
        a: [
          "A monitoring trigger applied across each trade or BOQ section. When actual cost exceeds estimated allowance by 5% or more on any section, the job flags for review. The full piece is at /insights/five-percent-variance-threshold.",
          "It is not a contingency, a markup buffer or a pricing allowance. It is a tolerance band. The point of the band is to surface a problem while a decision is still possible — absorb, recover or escalate. At 15% across multiple sections nobody caught, none of those decisions are available.",
        ],
      },
      {
        q: "Why monthly? Why not weekly?",
        a: [
          "Weekly cost monitoring exists, but the report that drives director-level decisions runs on a monthly cadence because that is how cash, commitments and forecast align in a residential building business. The right cadence is the one that matches the rhythm of the decision being made.",
          "Weekly reporting is for the CA. Monthly reporting is for the director. They are different artefacts.",
        ],
      },
      {
        q: "What does the monthly director report contain?",
        a: [
          "Five sections, every month, in the same order. Portfolio summary. Job tracking grid. Flagged items. Aged debtors. Escalations requiring director sign-off in the next 14 days. Read in full at /insights/monthly-director-report-walkthrough.",
        ],
      },
      {
        q: "How do you handle variations?",
        a: [
          "Every change to contracted scope is identified, priced and approved before any work proceeds. No verbal approval. No back-end reconciliation at PC. Variations are invoiced progressively so cash position reflects actual cost at every stage. The system is documented at /insights/variation-control-three-questions.",
        ],
      },
    ],
  },
  {
    id: "hawktress",
    label: "Hawktress™",
    title: "The cost intelligence platform.",
    blurb:
      "The reference database that sits behind every estimate.",
    items: [
      {
        q: "What is Hawktress?",
        a: [
          "A cost intelligence layer built from reconciled project data. Every job that completes feeds the next estimate. Estimators query Hawktress for comparable trade packages by postcode, build type and floor area before a contract is locked.",
          "It is a reference database, not a workflow tool. The full background is at /insights/building-hawktress-builder-builds-software.",
        ],
      },
      {
        q: "Is Hawktress sold separately?",
        a: [
          "Hawktress is the platform behind every BuildHawk engagement. We do not licence it as a standalone product. The data only stays valuable if it sits inside the contract administration practice that maintains it.",
        ],
      },
      {
        q: "What data is in Hawktress today?",
        a: [
          "Reconciled trade packages from completed BuildHawk jobs across Geelong and the western Melbourne fringe. Each record holds estimated cost, actual cost, variance, postcode, build type, floor area and completion date. The set grows with every job that lands at Practical Completion.",
        ],
      },
      {
        q: "Will my project data be shared?",
        a: [
          "No identifying client, address or contract data leaves your file. The cost reference data is anonymised and used to validate estimates on subsequent jobs. The full data handling policy is at /data-policy.",
        ],
      },
    ],
  },
  {
    id: "operations",
    label: "Working Together",
    title: "Practical questions.",
    blurb:
      "Tooling, communication, accreditations and the boring stuff that matters.",
    items: [
      {
        q: "What software do I need to use?",
        a: [
          "None on your side that you are not already running. We work with the accounting and project management systems most Australian residential builders already use.",
        ],
      },
      {
        q: "How do you communicate with the team?",
        a: [
          "A shared workspace per builder. Weekly check-in on Mondays. Monthly director debrief after the report drops on the 5th. Anything urgent goes straight through phone or email — there is no ticketing system between you and us.",
        ],
      },
      {
        q: "Are you licensed and insured?",
        a: [
          "BuildHawk Pty Ltd carries professional indemnity and public liability insurance appropriate to a contract administration practice. Certificates available on request. We are not a registered building practitioner — we administer the contracts your registered builder holds.",
        ],
      },
      {
        q: "What do the contract terms look like?",
        a: [
          "Standard terms are published at /terms-builders. Twelve-month minimum, 60 days notice to terminate, no exit penalty. The methodology either earns its keep or it does not.",
        ],
      },
      {
        q: "Can I speak to a builder you work with?",
        a: [
          "Yes. We arrange direct reference calls during the second discovery conversation. The builders we work with are the best argument for the engagement — and the most honest about where it is hard.",
        ],
      },
    ],
  },
];

export default function FaqPage() {
  const totalQuestions = sections.reduce((n, s) => n + s.items.length, 0);

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
                Frequently asked
              </p>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h1 className="font-medium tracking-[-0.03em] leading-[1.0] text-[44px] md:text-[68px] lg:text-[88px] text-bh-black">
                Straight answers.
                <br />
                <span className="text-bh-graphite">No marketing.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] md:text-[19px] leading-[1.5] tracking-[-0.005em] text-bh-graphite">
                The questions builders ask before they engage BuildHawk —
                answered the same way we&apos;d answer them on the discovery call.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] tracking-[0.18em] uppercase text-bh-graphite">
                <span>{totalQuestions} questions</span>
                <span className="w-px h-3 bg-bh-steel" />
                <span>{sections.length} categories</span>
                <span className="w-px h-3 bg-bh-steel" />
                <span>Last updated · May 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category jump nav */}
      <section className="pb-10 md:pb-14">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="border-y border-bh-steel/60 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
            <span className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite">
              Jump to
            </span>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-[13px] tracking-[-0.005em] text-bh-black hover:text-bh-orange transition-colors"
              >
                {s.label}
                <span className="ml-2 text-bh-graphite">{s.items.length}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sections */}
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="py-12 md:py-20 scroll-mt-32 border-b border-bh-steel/40 last:border-b-0"
        >
          <div className="mx-auto max-w-[1480px] px-6 md:px-10">
            <div className="grid grid-cols-12 gap-6 md:gap-12">
              <div className="col-span-12 md:col-span-4">
                <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-3">
                  {section.label}
                </p>
                <h2 className="font-medium tracking-[-0.02em] text-[28px] md:text-[40px] leading-[1.05] text-bh-black">
                  {section.title}
                </h2>
                <p className="mt-4 text-[15px] leading-[1.55] text-bh-graphite max-w-md">
                  {section.blurb}
                </p>
              </div>
              <div className="col-span-12 md:col-span-8">
                <div className="border-t border-bh-steel/60">
                  {section.items.map((item, idx) => (
                    <details
                      key={item.q}
                      className="group border-b border-bh-steel/60 py-6 md:py-7"
                    >
                      <summary className="flex items-start justify-between gap-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <div className="flex items-baseline gap-5">
                          <span className="text-[12px] tracking-[0.2em] uppercase text-bh-graphite tabular-nums pt-1">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <h3 className="text-[19px] md:text-[22px] font-medium tracking-[-0.015em] leading-[1.3] text-bh-black group-hover:text-bh-orange transition-colors">
                            {item.q}
                          </h3>
                        </div>
                        <span
                          aria-hidden
                          className="flex-none mt-1 inline-flex items-center justify-center w-9 h-9 rounded-full border border-bh-steel/60 text-bh-graphite group-hover:border-bh-orange group-hover:text-bh-orange transition-colors"
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
                      </summary>
                      <div className="pt-5 pl-0 md:pl-[60px] max-w-2xl">
                        {item.a.map((p, i) => (
                          <p
                            key={i}
                            className="text-[15px] md:text-[16px] leading-[1.65] tracking-[-0.005em] text-bh-graphite mb-3 last:mb-0"
                          >
                            {p}
                          </p>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-20 md:py-28 bg-bh-cloud">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-6 md:gap-8 items-end">
            <div className="col-span-12 md:col-span-8">
              <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-4">
                Still have a question
              </p>
              <h2 className="font-medium tracking-[-0.025em] text-[36px] md:text-[56px] leading-[1.05] text-bh-black">
                If it&apos;s not here,
                <br />
                <span className="text-bh-graphite">ask it on the call.</span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
              <Link
                href="/#intake"
                className="inline-flex items-center justify-center h-12 px-6 rounded-[8px] bg-bh-ink text-bh-paper text-[14px] tracking-[-0.005em] hover:bg-bh-orange transition-colors"
              >
                Start a brief
              </Link>
              <a
                href="tel:+61433366607"
                className="inline-flex items-center justify-center h-12 px-6 rounded-[8px] border border-bh-steel/60 text-bh-black text-[14px] tracking-[-0.005em] hover:border-bh-orange hover:text-bh-orange transition-colors"
              >
                Call +61 433 366 607
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-bh-ink text-bh-paper py-16">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <p className="text-[14px] tracking-[-0.005em] text-bh-steel/80">
              © {new Date().getFullYear()} BuildHawk Pty Ltd · Geelong, VIC
            </p>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-3" aria-label="Footer">
              <a href="/articles" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">Articles</a>
              <Link href="/insights" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">Field Notes</Link>
              <a href="/data-policy" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">Data policy</a>
              <a href="/terms-builders" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">Terms</a>
              <Link href="/" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">← Back to BuildHawk</Link>
            </nav>
          </div>
        </div>
        <div className="h-3 md:h-4 bg-bh-orange mt-16" />
      </footer>
    </main>
  );
}
