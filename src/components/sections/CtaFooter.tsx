"use client";
import Link from "next/link";

import { useEffect, useRef } from "react";
import BrandLockup from "@/components/BrandLockup";
import Button from "@/components/Button";
import Magnetic from "@/components/motion/Magnetic";
import Reveal from "@/components/motion/Reveal";

export default function CtaFooter() {
  const sweepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sweepRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("bh-sweep-on");
            obs.unobserve(el);
          }
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="contact"
      ref={sweepRef}
      className="relative overflow-hidden bg-bh-ink text-bh-paper"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-1/4 -top-1/2 h-[200%] origin-left rotate-[-12deg] opacity-0 bh-sweep-anim"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(222,81,35,0) 30%, rgba(222,81,35,0.18) 50%, rgba(222,81,35,0) 70%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative mx-auto max-w-[1480px] px-5 md:px-10 py-16 md:py-36">
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          <div className="col-span-12 md:col-span-3">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-steel/70">
              06 / Engage
            </p>
          </div>
          <Reveal as="div" className="col-span-12 md:col-span-9" duration={800}>
            <h2 className="font-medium tracking-[-0.03em] leading-[0.95] text-[36px] min-[420px]:text-[44px] sm:text-[64px] md:text-[88px] lg:text-[112px]">
              Where every build
              <br />
              <span className="text-bh-orange">starts with clarity.</span>
            </h2>
            <p className="mt-6 md:mt-8 max-w-2xl text-bh-steel text-[15px] md:text-[19px] leading-[1.55] tracking-[-0.01em]">
              We work with a deliberate number of operators each year. If
              margin protection is a priority on your next project, start with
              a call.
            </p>
            <div className="mt-7 md:mt-10 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
              <Magnetic pull={6}>
                <Button href="#intake">Start Your Brief</Button>
              </Magnetic>
              <Button href="tel:+61433366607" variant="ghost-dark">
                Call +61 433 366 607
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Highlighted contact panel */}
        <div className="mt-16 md:mt-20 rounded-[12px] border border-bh-orange/40 bg-bh-orange-900/15 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <a
              href="mailto:info@buildhawk.com.au"
              className="group flex items-start gap-4 p-6 md:p-7 border-b md:border-b-0 md:border-r border-bh-orange/25 hover:bg-bh-orange-900/25 transition-colors"
            >
              <span className="mt-1 inline-flex w-9 h-9 rounded-full bg-bh-orange/15 items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 4h12v8H2z M2 4l6 4 6-4" stroke="#de5123" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-bh-steel/80">
                  Email
                </p>
                <p className="mt-1 text-bh-paper text-[18px] md:text-[20px] tracking-[-0.01em] group-hover:text-bh-orange transition-colors">
                  info@buildhawk.com.au
                </p>
              </div>
            </a>

            <a
              href="tel:+61433366607"
              className="group flex items-start gap-4 p-6 md:p-7 border-b md:border-b-0 md:border-r border-bh-orange/25 hover:bg-bh-orange-900/25 transition-colors"
            >
              <span className="mt-1 inline-flex w-9 h-9 rounded-full bg-bh-orange/15 items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M3 4a1 1 0 0 1 1-1h1.7a1 1 0 0 1 .98.8l.4 2a1 1 0 0 1-.27.93l-.86.86a8 8 0 0 0 3.06 3.06l.86-.86a1 1 0 0 1 .93-.27l2 .4a1 1 0 0 1 .8.98V12a1 1 0 0 1-1 1A9 9 0 0 1 3 4z"
                    stroke="#de5123"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-bh-steel/80">
                  Phone
                </p>
                <p className="mt-1 text-bh-paper text-[18px] md:text-[20px] tracking-[-0.01em] group-hover:text-bh-orange transition-colors">
                  +61 433 366 607
                </p>
              </div>
            </a>

            <a
              href="#intake"
              className="group flex items-start gap-4 p-6 md:p-7 hover:bg-bh-orange-900/25 transition-colors"
            >
              <span className="mt-1 inline-flex w-9 h-9 rounded-full bg-bh-orange/15 items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 3h7l3 3v7H3z M10 3v3h3" stroke="#de5123" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 8h6 M5 10.5h6" stroke="#de5123" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-bh-steel/80">
                  Brief intake
                </p>
                <p className="mt-1 text-bh-paper text-[18px] md:text-[20px] tracking-[-0.01em] group-hover:text-bh-orange transition-colors">
                  Open the form
                </p>
              </div>
            </a>
          </div>
        </div>

        <footer className="mt-20 md:mt-28 pt-10 border-t border-bh-graphite/40 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-5">
            <BrandLockup tone="dark" size="md" showTagline />
            <p className="mt-5 max-w-xs text-[13px] leading-[1.55] text-bh-steel/70 tracking-[-0.005em]">
              BuildHawk Pty Ltd. Operator of Hawktress · the cost intelligence
              and project execution platform for residential builders, trades,
              and suppliers across Australia and New Zealand.
            </p>
          </div>

          <div className="col-span-6 md:col-span-2">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-steel/70 mb-4">
              Hawktress
            </p>
            <ul className="space-y-2 text-[13px] tracking-[-0.005em]">
              <li><Link href="/#hawktress" className="text-bh-paper hover:text-bh-orange transition-colors">Lifecycle</Link></li>
              <li><Link href="/#how" className="text-bh-paper hover:text-bh-orange transition-colors">How it works</Link></li>
              <li><Link href="/#pricing" className="text-bh-paper hover:text-bh-orange transition-colors">Pricing</Link></li>
              <li><a href="/partners" className="text-bh-paper hover:text-bh-orange transition-colors">Partners</a></li>
              <li><Link href="/#about" className="text-bh-paper hover:text-bh-orange transition-colors">About</Link></li>
              <li><Link href="/#intake" className="text-bh-paper hover:text-bh-orange transition-colors">Start a brief</Link></li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-steel/70 mb-4">
              Resources
            </p>
            <ul className="space-y-2 text-[13px] tracking-[-0.005em]">
              <li><a href="/articles" className="text-bh-paper hover:text-bh-orange transition-colors">Articles</a></li>
              <li><a href="/faq" className="text-bh-paper hover:text-bh-orange transition-colors">FAQ</a></li>
              <li><Link href="/insights" className="text-bh-paper hover:text-bh-orange transition-colors">Field Notes</Link></li>
              <li><a href="tel:+61433366607" className="text-bh-paper hover:text-bh-orange transition-colors">Call us</a></li>
              <li><a href="mailto:info@buildhawk.com.au" className="text-bh-paper hover:text-bh-orange transition-colors">Email us</a></li>
            </ul>
          </div>

          <div className="col-span-12 md:col-span-3">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-steel/70 mb-4">
              Legal
            </p>
            <ul className="space-y-2 text-[13px] tracking-[-0.005em]">
              <li><a href="/terms-builders" className="text-bh-paper hover:text-bh-orange transition-colors">Builder terms</a></li>
              <li><a href="/terms-trades" className="text-bh-paper hover:text-bh-orange transition-colors">Trade terms</a></li>
              <li><a href="/terms-suppliers" className="text-bh-paper hover:text-bh-orange transition-colors">Supplier terms</a></li>
              <li><a href="/data-policy" className="text-bh-paper hover:text-bh-orange transition-colors">Data policy</a></li>
            </ul>
          </div>

          <div className="col-span-12 pt-8 border-t border-bh-graphite/40 flex flex-col md:flex-row items-start md:items-end justify-between gap-3 text-[12px] tracking-[-0.005em] text-bh-steel/70">
            <p>© {new Date().getFullYear()} BuildHawk Pty Ltd · Geelong, VIC · Australia</p>
            <p>Governing law · Victoria, Australia</p>
            <a className="hover:text-bh-paper" href="#top">Back to top ↑</a>
          </div>
        </footer>
      </div>

      {/* Brand signature: bottom orange band (from stationery) */}
      <div className="relative h-3 md:h-4 bg-bh-orange" aria-hidden />

      <style jsx>{`
        .bh-sweep-anim {
          animation: none;
        }
        :global(.bh-sweep-on) .bh-sweep-anim,
        .bh-sweep-on .bh-sweep-anim {
          animation: bh-sweep 2.6s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
        }
        @keyframes bh-sweep {
          0% {
            opacity: 0;
            transform: translateX(-120%) rotate(-12deg);
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(120%) rotate(-12deg);
          }
        }
      `}</style>
    </section>
  );
}
