import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import CtaFooter from "@/components/sections/CtaFooter";

export const metadata: Metadata = {
  title: "Off-site · BuildHawk",
  description:
    "The page you were after isn't here. Head back to BuildHawk or pick another route below.",
};

export default function NotFound() {
  return (
    <main className="relative bg-bh-white text-bh-black">
      <Nav />

      <section className="pt-32 md:pt-44 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1480px] px-5 md:px-10">
          <div className="grid grid-cols-12 gap-6 md:gap-8 items-end">
            <div className="col-span-12 md:col-span-3">
              <p className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.2em] uppercase text-bh-orange">
                <span className="inline-block w-3 h-px bg-bh-orange" />
                404 · Off-site
              </p>
            </div>
            <div className="col-span-12 md:col-span-9">
              <p className="font-medium tracking-[-0.04em] leading-[0.95] text-bh-orange text-[88px] md:text-[148px] lg:text-[200px] tabular-nums">
                404
              </p>
              <h1 className="mt-2 font-medium tracking-[-0.03em] leading-[1.05] text-[36px] md:text-[56px] lg:text-[72px] text-bh-black">
                Off the run sheet.
                <br />
                <span className="text-bh-graphite">
                  This page isn&apos;t on site.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] md:text-[19px] leading-[1.55] tracking-[-0.005em] text-bh-graphite">
                Either the link is stale or the page has moved. Pick the
                closest route below, or head back to BuildHawk.
              </p>
            </div>
          </div>

          <ul className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-bh-steel/40 border border-bh-steel/40">
            {[
              { href: "/", label: "Home", note: "Hero, lifecycle, pricing" },
              { href: "/partners", label: "Partners", note: "Featured case study + accreditation" },
              { href: "/insights", label: "Insights", note: "Hawktress Field Notes" },
              { href: "/#intake", label: "Start a brief", note: "Send us your project" },
            ].map((l) => (
              <li key={l.href} className="bg-bh-white">
                <Link
                  href={l.href}
                  className="group flex flex-col gap-2 p-6 md:p-7 hover:bg-bh-cloud transition-colors h-full"
                >
                  <span className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite">
                    Try
                  </span>
                  <span className="inline-flex items-center justify-between gap-3 text-[18px] md:text-[20px] tracking-[-0.01em] text-bh-black font-medium group-hover:text-bh-orange transition-colors">
                    {l.label}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-[13px] leading-[1.5] tracking-[-0.005em] text-bh-graphite">
                    {l.note}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaFooter />
    </main>
  );
}
