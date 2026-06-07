import Link from "next/link";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ArticleCard from "@/components/blog/ArticleCard";
import { getSortedArticles, type Article } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Articles · BuildHawk",
  description:
    "Methodology, field notes and operator handbooks from the BuildHawk team and the Hawktress™ platform — written by people who run estimating and contract administration on live Australian residential jobs.",
};

const categoryOrder: Article["category"][] = [
  "Methodology",
  "Operator Handbook",
  "Field Notes",
  "Founder",
];

function groupByCategory(articles: Article[]) {
  const map = new Map<Article["category"], Article[]>();
  for (const a of articles) {
    const list = map.get(a.category) ?? [];
    list.push(a);
    map.set(a.category, list);
  }
  return categoryOrder
    .map((cat) => ({ category: cat, items: map.get(cat) ?? [] }))
    .filter((g) => g.items.length > 0);
}

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const all = await getSortedArticles();
  const grouped = groupByCategory(all);
  const years = Array.from(new Set(all.map((a) => a.date.slice(0, 4)))).sort();
  const yearRange = years.length > 1 ? `${years[0]} → ${years[years.length - 1]}` : years[0];

  return (
    <main className="relative bg-bh-white text-bh-black">
      <Nav />

      <section className="pt-32 md:pt-44 pb-12 md:pb-16">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-6 md:gap-8 mb-10 md:mb-14">
            <div className="col-span-12 md:col-span-3">
              <p className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.2em] uppercase text-bh-orange">
                <span className="inline-block w-3 h-px bg-bh-orange" />
                Articles
              </p>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h1 className="font-medium tracking-[-0.03em] leading-[1.0] text-[44px] md:text-[68px] lg:text-[88px] text-bh-black">
                Every piece.
                <br />
                <span className="text-bh-graphite">One archive.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] md:text-[19px] leading-[1.5] tracking-[-0.005em] text-bh-graphite">
                The full BuildHawk catalogue. Methodology, operator handbooks,
                field notes and founder writing — grouped by series, sorted by
                date.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] tracking-[0.18em] uppercase text-bh-graphite">
                <span>{all.length} pieces</span>
                <span className="w-px h-3 bg-bh-steel" />
                <span>{yearRange}</span>
                <span className="w-px h-3 bg-bh-steel" />
                <span>{grouped.length} series</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category jump nav */}
      <section className="pb-10">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="border-y border-bh-steel/60 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
            <span className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite">
              Jump to
            </span>
            {grouped.map((g) => (
              <a
                key={g.category}
                href={`#${slugifyCategory(g.category)}`}
                className="text-[13px] tracking-[-0.005em] text-bh-black hover:text-bh-orange transition-colors"
              >
                {g.category}
                <span className="ml-2 text-bh-graphite">{g.items.length}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Grouped grids */}
      {grouped.map((g, i) => (
        <section
          key={g.category}
          id={slugifyCategory(g.category)}
          className={`${i === 0 ? "pt-2" : "pt-12"} pb-16 md:pb-20 scroll-mt-32`}
        >
          <div className="mx-auto max-w-[1480px] px-6 md:px-10">
            <div className="grid grid-cols-12 gap-6 md:gap-8 mb-10 md:mb-12">
              <div className="col-span-12 md:col-span-3">
                <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange">
                  Series · {String(i + 1).padStart(2, "0")}
                </p>
              </div>
              <div className="col-span-12 md:col-span-9">
                <h2 className="font-medium tracking-[-0.02em] text-[28px] md:text-[36px] text-bh-black">
                  {g.category}
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-[1.55] text-bh-graphite">
                  {categoryDescription(g.category)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
              {g.items.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <footer className="bg-bh-ink text-bh-paper py-16">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <p className="text-[14px] tracking-[-0.005em] text-bh-steel/80">
              © {new Date().getFullYear()} BuildHawk Pty Ltd · Geelong, VIC
            </p>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-3" aria-label="Footer">
              <a href="/faq" className="text-[13px] tracking-[-0.005em] text-bh-paper hover:text-bh-orange transition-colors">FAQ</a>
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

function slugifyCategory(c: string) {
  return c.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function categoryDescription(c: Article["category"]): string {
  switch (c) {
    case "Methodology":
      return "How BuildHawk runs cost control, monthly reporting cadence and the structures behind every active job.";
    case "Operator Handbook":
      return "Tactical playbooks for the work that runs on site — sitework, variations, contract administration.";
    case "Field Notes":
      return "Short observations from live jobs across Geelong and the western Melbourne fringe.";
    case "Founder":
      return "Why BuildHawk and Hawktress exist, written by Nathan Holloway.";
  }
}
