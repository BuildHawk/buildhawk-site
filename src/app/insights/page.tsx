import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ArticleCard from "@/components/blog/ArticleCard";
import { getSortedArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Hawktress Field Notes · BuildHawk Insights",
  description:
    "Field notes from inside Australian residential construction. Estimating, contract administration, variation control and the data behind margin protection — written by the BuildHawk team and the Hawktress™ platform.",
};

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const all = await getSortedArticles();
  const [feature, ...rest] = all;

  return (
    <main className="relative bg-bh-white text-bh-black">
      <Nav />

      <section className="pt-32 md:pt-44 pb-12 md:pb-16">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-6 md:gap-8 mb-12 md:mb-16">
            <div className="col-span-12 md:col-span-3">
              <p className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.2em] uppercase text-bh-orange">
                <span className="inline-block w-3 h-px bg-bh-orange" />
                Hawktress<sup className="text-[0.55em] align-super">™</sup> Field Notes
              </p>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h1 className="font-medium tracking-[-0.03em] leading-[1.0] text-[44px] md:text-[68px] lg:text-[88px] text-bh-black">
                Written on the tools.
                <br />
                <span className="text-bh-graphite">
                  Not from a desk.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] md:text-[19px] leading-[1.5] tracking-[-0.005em] text-bh-graphite">
                Methodology, field notes and operator handbooks from the
                BuildHawk team and the Hawktress<sup className="text-[0.5em] align-super">™</sup>{" "}
                platform. Written by people who run estimating and contract
                administration on live Australian residential jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature article */}
      {feature && (
        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-[1480px] px-6 md:px-10">
            <ArticleCard article={feature} variant="feature" />
          </div>
        </section>
      )}

      {/* Hairline divider */}
      <div className="mx-auto max-w-[1480px] px-6 md:px-10">
        <div className="border-t border-bh-steel/60" />
      </div>

      {/* Rest of the articles */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="flex items-baseline justify-between mb-10 md:mb-12">
            <h2 className="text-[20px] md:text-[24px] font-medium tracking-[-0.015em] text-bh-black">
              Articles
            </h2>
            <a
              href="/articles"
              className="text-[12px] tracking-[0.18em] uppercase text-bh-graphite hover:text-bh-orange transition-colors"
            >
              {all.length} pieces · 2024 → 2026 →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
            {rest.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-bh-ink text-bh-paper py-16">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-[14px] tracking-[-0.005em] text-bh-steel/80">
            © {new Date().getFullYear()} BuildHawk Pty Ltd · Geelong, VIC
          </p>
          <a
            href="/"
            className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors"
          >
            ← Back to BuildHawk
          </a>
        </div>
        <div className="h-3 md:h-4 bg-bh-orange mt-16" />
      </footer>
    </main>
  );
}
