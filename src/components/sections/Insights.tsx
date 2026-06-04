import Link from "next/link";
import ArticleCard from "@/components/blog/ArticleCard";
import { getSortedArticles } from "@/lib/articles";

export default async function Insights() {
  const recent = (await getSortedArticles()).slice(0, 3);
  return (
    <section className="relative bg-bh-white py-16 md:py-36">
      <div className="mx-auto max-w-[1480px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-6 md:gap-8 mb-12 md:mb-16 items-end">
          <div className="col-span-12 md:col-span-7">
            <p className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-4">
              <span className="inline-block w-3 h-px bg-bh-orange" />
              Hawktress<sup className="text-[0.55em] align-super">™</sup> Field Notes
            </p>
            <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[36px] md:text-[52px] lg:text-[64px] text-bh-black">
              Written on the tools.
              <br />
              <span className="text-bh-graphite">Not from a desk.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-[16px] md:text-[18px] leading-[1.55] tracking-[-0.005em] text-bh-graphite">
              Methodology, field notes and operator handbooks from the
              BuildHawk team. Written by people who run estimating and
              contract administration on live Australian residential jobs.
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 md:text-right">
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 text-[14px] tracking-[-0.005em] text-bh-orange hover:text-bh-orange-700 transition-colors"
            >
              View all field notes
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-12">
          {recent.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
