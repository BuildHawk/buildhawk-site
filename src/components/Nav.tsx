"use client";

import { useEffect, useState } from "react";
import BrandLockup from "@/components/BrandLockup";

const links = [
  { href: "/#hawktress", label: "Hawktress", section: "hawktress" },
  { href: "/#how", label: "How It Works", section: "how" },
  { href: "/#pricing", label: "Pricing", section: "pricing" },
  { href: "/commercial-support", label: "Commercial Support", section: null },
  { href: "/peace-of-mind", label: "Peace of Mind", section: null },
  { href: "/partners", label: "Partners", section: null },
  { href: "/articles", label: "Articles", section: null },
  { href: "/faq", label: "FAQ", section: null },
  { href: "/#about", label: "About", section: "about" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    let raf = 0;
    let lastY = -1;
    const tick = () => {
      const y = window.scrollY;
      if (y !== lastY) {
        lastY = y;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setScrolled(y > 24);
        setProgress(h > 0 ? Math.min(100, (y / h) * 100) : 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const ids = links.map((l) => l.section).filter(Boolean) as string[];
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-md bg-bh-white/80 border-b border-bh-steel/40"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <span
        className="bh-scroll-progress"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
      <div className="mx-auto max-w-[1480px] px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <a href="#top" className="flex items-center">
          <BrandLockup tone="light" size="sm" />
        </a>
        <nav className="hidden md:flex items-center gap-9">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-active={l.section ? active === l.section : undefined}
              className="bh-nav-link text-[13px] tracking-[-0.005em] text-bh-graphite hover:text-bh-black transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          <a
            href="tel:+61433366607"
            aria-label="Call BuildHawk"
            className="hidden lg:inline-flex items-center gap-2 text-[13px] tracking-[-0.005em] text-bh-graphite hover:text-bh-orange transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M2.5 3a1 1 0 0 1 1-1h1.6a1 1 0 0 1 .98.8l.4 2a1 1 0 0 1-.27.93l-.86.86a8 8 0 0 0 3.06 3.06l.86-.86a1 1 0 0 1 .93-.27l2 .4a1 1 0 0 1 .8.98V11a1 1 0 0 1-1 1A9 9 0 0 1 2.5 3z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            +61 433 366 607
          </a>
          <a
            href="tel:+61433366607"
            aria-label="Call BuildHawk"
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-[8px] text-bh-black hover:bg-bh-cloud transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M2.5 3a1 1 0 0 1 1-1h1.6a1 1 0 0 1 .98.8l.4 2a1 1 0 0 1-.27.93l-.86.86a8 8 0 0 0 3.06 3.06l.86-.86a1 1 0 0 1 .93-.27l2 .4a1 1 0 0 1 .8.98V11a1 1 0 0 1-1 1A9 9 0 0 1 2.5 3z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a
            href="/#intake"
            className="hidden sm:inline-flex items-center h-10 px-5 rounded-[8px] bg-bh-ink text-bh-paper text-[13px] tracking-[-0.005em] hover:bg-bh-orange transition-colors"
          >
            Start Brief
          </a>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-[8px] text-bh-black hover:bg-bh-cloud transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
              <path
                d={mobileOpen ? "M5 5 L17 17 M17 5 L5 17" : "M3 7 H19 M3 11 H19 M3 15 H19"}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed inset-x-0 top-16 bottom-0 bg-bh-white transition-[opacity,transform] duration-300 ease-out ${
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="h-full overflow-y-auto px-6 py-8 flex flex-col">
          <nav className="flex flex-col">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                data-active={l.section ? active === l.section : undefined}
                className="bh-nav-link group flex items-center justify-between py-5 border-b border-bh-steel/40 text-bh-black"
                style={{
                  transitionDelay: mobileOpen ? `${80 + i * 40}ms` : "0ms",
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? "translateY(0)" : "translateY(8px)",
                  transitionProperty: "opacity, transform",
                  transitionDuration: "360ms",
                  transitionTimingFunction: "cubic-bezier(0.2,0.7,0.2,1)",
                }}
              >
                <span className="text-[22px] tracking-[-0.02em] font-medium">
                  {l.label}
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden
                  className="text-bh-graphite group-hover:text-bh-orange transition-colors"
                >
                  <path
                    d="M5 9 H13 M9 5 L13 9 L9 13"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ))}
          </nav>
          <div className="mt-auto pt-10 grid grid-cols-2 gap-3">
            <a
              href="tel:+61433366607"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center h-12 rounded-[8px] border border-bh-steel/60 text-bh-black text-[14px] tracking-[-0.005em] hover:bg-bh-cloud transition-colors"
            >
              Call
            </a>
            <a
              href="/#intake"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center h-12 rounded-[8px] bg-bh-ink text-bh-paper text-[14px] tracking-[-0.005em] hover:bg-bh-orange transition-colors"
            >
              Start Brief
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
