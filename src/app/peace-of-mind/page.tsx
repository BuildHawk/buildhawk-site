import Link from "next/link";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import StartForm from "./StartForm";

export const metadata: Metadata = {
  title: "Peace of Mind · Independent quote review for homeowners · BuildHawk",
  description:
    "Before you sign a building contract, know exactly what you're paying for. BuildHawk reviews your builder quotes against your plans, lines them up apples for apples, and flags the scope gaps, under-allowances and variation risks that cost homeowners tens of thousands. $499 + GST, fully online, up to 3 quotes.",
  alternates: {
    canonical: "/peace-of-mind",
  },
  openGraph: {
    type: "website",
    title: "Peace of Mind · Independent quote review for homeowners",
    description:
      "Independent, third-party review of your builder quotes. $499 + GST, fully online, report within 5 business days.",
    url: "/peace-of-mind",
  },
};

const FLYER_PDF = "/buildhawk-peace-of-mind.pdf";
const CONTACT_EMAIL = "info@buildhawk.com.au";
const START_ANCHOR = "#start";

const mismatches = [
  "One builder includes site costs. Another does not.",
  "One allows realistic PC sums. Another under-allows.",
  "One excludes permits, engineering or service connections.",
  "The cheapest quote can recover the gap through variations later.",
];

const coverage = [
  {
    num: "01",
    title: "Apples for apples comparison",
    body: "We align every quote so you can see exactly where they differ and what each one has, or has not, included.",
  },
  {
    num: "02",
    title: "Risk assessment",
    body: "We flag high variation-risk items, unrealistic allowances, missing documentation and the areas most likely to cause disputes.",
  },
  {
    num: "03",
    title: "Budget reality check",
    body: "As builders ourselves, an honest opinion on whether the quote is realistic and whether you are likely to face significant extras.",
  },
  {
    num: "04",
    title: "Questions to ask before signing",
    body: "Practical builder questions on rock excavation, engineering changes, electrical upgrades and service connections.",
  },
];

const steps = [
  "Pay online",
  "Upload your quotes, plans and specifications",
  "We review and reconcile",
  "Detailed report",
];

export default async function PeaceOfMindPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const paymentStatus =
    sp.paid === "1" ? "paid" : sp.cancelled === "1" ? "cancelled" : undefined;
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
                Peace of Mind
              </p>
              <p className="mt-2 text-[13px] tracking-[-0.005em] text-bh-graphite">
                Independent quote review for homeowners
              </p>
            </div>
            <div className="col-span-12 md:col-span-9">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-5">
                <span className="text-bh-orange font-medium">$499 + GST</span>
                <span className="w-px h-3 bg-bh-steel" />
                <span>Fully online</span>
                <span className="w-px h-3 bg-bh-steel" />
                <span>Up to 3 quotes</span>
              </div>
              <h1 className="font-medium tracking-[-0.03em] leading-[1.0] text-[40px] md:text-[60px] lg:text-[76px] text-bh-black">
                Before you sign a building contract,
                <br />
                <span className="text-bh-orange">
                  know exactly what you’re paying for.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] md:text-[19px] leading-[1.5] tracking-[-0.005em] text-bh-graphite">
                BuildHawk reviews your builder quotes against your plans and
                specifications, lines them up apples for apples, and flags the
                scope gaps, under-allowances and variation risks that cost
                homeowners tens of thousands after the contract is signed.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={START_ANCHOR}
                  className="inline-flex items-center justify-center h-12 px-6 rounded-[8px] bg-bh-ink text-bh-paper text-[14px] tracking-[-0.005em] hover:bg-bh-orange transition-colors"
                >
                  Start your review
                </a>
                <a
                  href={FLYER_PDF}
                  download
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-[8px] border border-bh-steel/60 text-bh-black text-[14px] tracking-[-0.005em] hover:border-bh-orange hover:text-bh-orange transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M7 1.5v8m0 0L4 6.5M7 9.5l3-3M2 11.5h10"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download the one-pager (PDF)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="pb-12 md:pb-20">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="rounded-[4px] border-l-[6px] border-bh-orange bg-bh-cloud p-6 md:p-10">
            <div className="grid grid-cols-12 gap-6 md:gap-12">
              <div className="col-span-12 md:col-span-5">
                <h2 className="font-medium tracking-[-0.02em] text-[24px] md:text-[34px] leading-[1.1] text-bh-black">
                  Three quotes, three different numbers, and no way to compare
                  them.
                </h2>
              </div>
              <div className="col-span-12 md:col-span-7">
                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                  {mismatches.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-3 text-[15px] leading-[1.45] text-bh-graphite"
                    >
                      <span className="mt-[7px] inline-block w-1.5 h-1.5 flex-none bg-bh-orange" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What your review covers */}
      <section className="py-12 md:py-20 border-y border-bh-steel/40">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-6 md:gap-12">
            <div className="col-span-12 md:col-span-4">
              <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-3">
                What your review covers
              </p>
              <h2 className="font-medium tracking-[-0.02em] text-[28px] md:text-[40px] leading-[1.05] text-bh-black">
                Four things you get,
                <br />
                <span className="text-bh-graphite">on every review.</span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-8">
              <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                {coverage.map((c) => (
                  <article
                    key={c.num}
                    className="rounded-[10px] border border-bh-steel/60 p-6 hover:border-bh-graphite/60 transition-colors"
                  >
                    <p className="font-medium text-bh-orange text-[22px] leading-none tracking-[-0.02em] tabular-nums">
                      {c.num}
                    </p>
                    <h3 className="mt-3 text-[17px] md:text-[18px] font-medium tracking-[-0.015em] text-bh-black">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.5] text-bh-graphite">
                      {c.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price + how it works */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-8 md:gap-12 items-start">
            <div className="col-span-12 md:col-span-5">
              <p className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium tracking-[-0.03em] tabular-nums text-bh-black text-[64px] md:text-[80px] leading-[0.95]">
                  $499
                </span>
                <span className="text-[18px] font-medium text-bh-orange">
                  + GST
                </span>
              </p>
              <p className="mt-3 text-[15px] leading-[1.5] text-bh-graphite max-w-sm">
                One flat fee, whether you have one quote or three.
              </p>
              <a
                href={START_ANCHOR}
                className="mt-7 inline-flex items-center justify-between gap-4 rounded-[8px] pl-5 pr-2 h-12 text-[14px] tracking-[-0.005em] font-medium bg-bh-orange text-bh-paper hover:bg-bh-orange-700 transition-colors"
              >
                Get started
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
            <div className="col-span-12 md:col-span-7">
              <p className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite mb-5">
                How it works
              </p>
              <ol className="border-t border-bh-steel/60">
                {steps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-5 py-4 border-b border-bh-steel/60"
                  >
                    <span className="font-medium text-bh-orange text-[15px] tabular-nums pt-px w-6 flex-none">
                      {i + 1}
                    </span>
                    <span className="text-[15px] md:text-[16px] leading-[1.4] text-bh-black">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Tick-and-flick form + uploads */}
      <section id="start" className="scroll-mt-24 py-16 md:py-24 border-t border-bh-steel/40">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-8 md:gap-12">
            <div className="col-span-12 md:col-span-4">
              <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-3">
                Start your review
              </p>
              <h2 className="font-medium tracking-[-0.02em] text-[28px] md:text-[40px] leading-[1.05] text-bh-black">
                Send us your quotes.
                <br />
                <span className="text-bh-graphite">We take it from here.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-[1.55] text-bh-graphite max-w-sm">
                A few details and your quote files. We confirm by phone or
                email within one business day before any payment.
              </p>
              <ul className="mt-6 space-y-3 text-[14px] text-bh-graphite">
                <li className="flex items-start gap-3">
                  <span className="mt-[7px] inline-block w-1.5 h-1.5 flex-none bg-bh-orange" />
                  <span>Up to 3 builder quotes per review</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[7px] inline-block w-1.5 h-1.5 flex-none bg-bh-orange" />
                  <span>PDF, image, Word or Excel files welcome</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-[7px] inline-block w-1.5 h-1.5 flex-none bg-bh-orange" />
                  <span>Detailed report back within 5 business days</span>
                </li>
              </ul>
            </div>
            <div className="col-span-12 md:col-span-8">
              <StartForm paymentStatus={paymentStatus} />
            </div>
          </div>
        </div>
      </section>

      {/* Assurance */}
      <section className="py-16 md:py-24 bg-bh-cloud">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10 text-center">
          <span className="inline-block w-11 h-[3px] bg-bh-orange mb-5" />
          <h2 className="font-medium tracking-[-0.02em] text-[28px] md:text-[40px] leading-[1.1] text-bh-black">
            Independent, and on your side.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-[16px] md:text-[17px] leading-[1.55] text-bh-graphite">
            We don’t criticise your builder and we won’t tell you who to choose.
            As builders ourselves, we tell you how the numbers stack up so you
            can decide with confidence.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-bh-ink text-bh-paper">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-6 md:gap-8 items-end">
            <div className="col-span-12 md:col-span-8">
              <h2 className="font-medium tracking-[-0.025em] text-[36px] md:text-[56px] leading-[1.03]">
                Spend $499
                <br />
                <span className="text-bh-orange">before you spend $800,000.</span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
              <a
                href={START_ANCHOR}
                className="inline-flex items-center justify-center h-12 px-6 rounded-[8px] bg-bh-orange text-bh-paper text-[14px] tracking-[-0.005em] hover:bg-bh-orange-700 transition-colors"
              >
                Start your review
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center justify-center h-12 px-6 rounded-[8px] border border-bh-steel/40 text-bh-paper text-[14px] tracking-[-0.005em] hover:border-bh-orange hover:text-bh-orange transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-bh-ink text-bh-paper pb-16 border-t border-bh-paper/10">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10 pt-12">
          <p className="max-w-4xl text-[12px] leading-[1.5] text-bh-steel/70">
            BuildHawk provides an independent, third-party opinion based solely
            on the documents you provide. This service is not legal, financial
            or contractual advice and does not replace a building lawyer.
            BuildHawk does not recommend or endorse any builder. Findings are
            limited to the information supplied and cannot guarantee that every
            omission or risk has been identified. Full limitation of liability
            is set out in the engagement terms accepted at checkout.
          </p>
          <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <p className="text-[14px] tracking-[-0.005em] text-bh-steel/80">
              © {new Date().getFullYear()} BuildHawk Pty Ltd · Geelong, VIC
            </p>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-3" aria-label="Footer">
              <a href={FLYER_PDF} download className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">Download one-pager</a>
              <a href="/faq" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">FAQ</a>
              <a href="/data-policy" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">Data policy</a>
              <Link href="/" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">← Back to BuildHawk</Link>
            </nav>
          </div>
        </div>
        <div className="h-3 md:h-4 bg-bh-orange mt-12" />
      </footer>
    </main>
  );
}
