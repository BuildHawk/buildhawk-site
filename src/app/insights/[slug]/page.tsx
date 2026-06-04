import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import ArticleBody from "@/components/blog/ArticleBody";
import ArticleCard from "@/components/blog/ArticleCard";
import {
  authors,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/articles";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Insights · BuildHawk" };
  return {
    title: `${article.title} · BuildHawk Insights`,
    description: article.dek,
    openGraph: {
      title: article.title,
      description: article.dek,
      images: [article.cover],
      type: "article",
      publishedTime: article.date,
      authors: [authors[article.authorId].name],
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const author = authors[article.authorId];
  const related = await getRelatedArticles(slug, 2);

  return (
    <main className="relative bg-bh-white text-bh-black">
      <Nav />

      {/* Header */}
      <header className="pt-32 md:pt-44 pb-12 md:pb-16">
        <div className="mx-auto max-w-[820px] px-6 md:px-10">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase text-bh-graphite hover:text-bh-orange transition-colors mb-8"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M11 7H3m0 0l3.5-3.5M3 7l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            All insights
          </Link>

          <div className="flex items-center gap-3 text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-5">
            <span className="text-bh-orange">{article.category}</span>
            <span className="w-px h-3 bg-bh-steel" />
            <span>{formatDate(article.date)}</span>
            <span className="w-px h-3 bg-bh-steel" />
            <span>{article.readingTime} min read</span>
          </div>

          <h1 className="font-medium tracking-[-0.03em] leading-[1.05] text-[36px] md:text-[52px] lg:text-[64px] text-bh-black">
            {article.title}
          </h1>
          <p className="mt-6 text-[18px] md:text-[20px] leading-[1.5] tracking-[-0.005em] text-bh-graphite">
            {article.dek}
          </p>

          <div className="mt-8 flex items-center gap-4 pt-8 border-t border-bh-steel/60">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-bh-cloud border border-bh-steel/60">
              <Image
                src="/brand/emblem-bh.svg"
                alt=""
                width={28}
                height={22}
                className="absolute inset-0 m-auto block dark:hidden"
              />
              <Image
                src="/brand/emblem-bh-dark.svg"
                alt=""
                width={28}
                height={22}
                className="absolute inset-0 m-auto hidden dark:block"
              />
            </div>
            <div>
              <p className="text-[14px] font-medium tracking-[-0.005em] text-bh-black">
                {author.name}
              </p>
              <p className="text-[12px] tracking-[-0.005em] text-bh-graphite">
                {author.title}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Cover image */}
      <figure className="mx-auto max-w-[1280px] px-6 md:px-10 mb-12 md:mb-16">
        <div className="relative aspect-[16/9] overflow-hidden bg-bh-cloud">
          <Image
            src={article.cover}
            alt=""
            fill
            sizes="1280px"
            className="object-cover"
            priority
          />
        </div>
      </figure>

      {/* Body */}
      <article className="mx-auto max-w-[820px] px-6 md:px-10 pb-20 md:pb-28">
        <ArticleBody article={article} />
      </article>

      {/* Author / share footer */}
      <section className="bg-bh-cloud py-16 md:py-20">
        <div className="mx-auto max-w-[820px] px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite mb-2">
                Written by
              </p>
              <p className="text-[20px] font-medium tracking-[-0.01em] text-bh-black">
                {author.name}
              </p>
              <p className="text-[14px] tracking-[-0.005em] text-bh-graphite">
                {author.title}
              </p>
            </div>
            <a
              href="/#intake"
              className="inline-flex items-center justify-between gap-4 rounded-[8px] pl-5 pr-2 h-11 text-[13px] tracking-[-0.005em] font-medium bg-bh-orange text-bh-paper hover:bg-bh-orange-700 transition-colors"
            >
              Start your brief
              <span className="inline-flex items-center justify-center rounded-full w-7 h-7 bg-bh-paper/20">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
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
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="py-16 md:py-24 bg-bh-white">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="text-[24px] md:text-[28px] font-medium tracking-[-0.015em] text-bh-black">
                Related insights
              </h2>
              <Link
                href="/insights"
                className="text-[13px] tracking-[-0.005em] text-bh-orange hover:text-bh-orange-700 underline underline-offset-4"
              >
                See all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-bh-ink text-bh-paper py-12">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-[13px] tracking-[-0.005em] text-bh-steel/80">
            © {new Date().getFullYear()} BuildHawk Pty Ltd · Geelong, VIC
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] tracking-[-0.005em]">
            <Link href="/insights" className="text-bh-paper hover:text-bh-orange transition-colors">All insights</Link>
            <Link href="/" className="text-bh-paper hover:text-bh-orange transition-colors">Back to BuildHawk</Link>
          </div>
        </div>
        <div className="h-3 md:h-4 bg-bh-orange mt-12" />
      </footer>
    </main>
  );
}
