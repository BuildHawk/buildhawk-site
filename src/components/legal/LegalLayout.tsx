import Nav from "@/components/Nav";
import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalLayout({
  eyebrow,
  title,
  version,
  date,
  children,
}: {
  eyebrow: string;
  title: string;
  version: string;
  date: string;
  children: ReactNode;
}) {
  return (
    <main className="relative bg-bh-white text-bh-black">
      <Nav />

      <article className="mx-auto max-w-[820px] px-6 md:px-10 pt-32 md:pt-44 pb-24 md:pb-32">
        <header className="mb-12 md:mb-16 pb-10 border-b border-bh-steel/60">
          <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-4">
            {eyebrow}
          </p>
          <h1 className="font-medium tracking-[-0.03em] leading-[1.05] text-[36px] md:text-[52px] lg:text-[64px] text-bh-black">
            {title}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[12px] tracking-[-0.005em] text-bh-graphite">
            <p>
              Issued by · <span className="text-bh-black">BuildHawk Pty Ltd</span>
            </p>
            <p>
              Version · <span className="text-bh-black">{version}</span>
            </p>
            <p>
              Date · <span className="text-bh-black">{date}</span>
            </p>
            <p>
              Governing law ·{" "}
              <span className="text-bh-black">Victoria, Australia</span>
            </p>
          </div>
        </header>

        <div className="prose-bh">{children}</div>

        <footer className="mt-20 pt-10 border-t border-bh-steel/60">
          <p className="text-[12px] tracking-[-0.005em] text-bh-graphite">
            For questions about these terms, contact{" "}
            <a
              href="mailto:info@buildhawk.com.au"
              className="text-bh-orange hover:text-bh-orange-700 underline underline-offset-4"
            >
              info@buildhawk.com.au
            </a>
            .
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12px] tracking-[-0.005em]">
            <Link
              href="/"
              className="text-bh-graphite hover:text-bh-black transition-colors"
            >
              ← Back to BuildHawk
            </Link>
            <span className="text-bh-steel">·</span>
            <Link
              href="/terms-builders"
              className="text-bh-graphite hover:text-bh-black transition-colors"
            >
              Builder terms
            </Link>
            <Link
              href="/terms-trades"
              className="text-bh-graphite hover:text-bh-black transition-colors"
            >
              Trade terms
            </Link>
            <Link
              href="/terms-suppliers"
              className="text-bh-graphite hover:text-bh-black transition-colors"
            >
              Supplier terms
            </Link>
            <Link
              href="/data-policy"
              className="text-bh-graphite hover:text-bh-black transition-colors"
            >
              Data policy
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
