import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getActiveContext } from "@/lib/auth";
import { getDbArticleById } from "@/lib/db-articles";
import GlassBackground from "../../../_components/GlassBackground";
import ArticleForm from "../../_components/ArticleForm";

export const metadata: Metadata = {
  title: "Edit article · BuildHawk CMS",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditArticlePage({ params }: { params: Params }) {
  const ctx = await getActiveContext().catch(() => null);
  if (!ctx) redirect("/command-centre/login?next=/command-centre/articles");

  const { id } = await params;
  const article = await getDbArticleById(id);
  if (!article) notFound();

  return (
    <div className="min-h-screen text-slate-900">
      <GlassBackground tone="light" />

      <header className="relative border-b border-white/40 bg-white/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href="/command-centre/articles"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Articles
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900 truncate max-w-[240px]">
            {article.title}
          </span>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-orange-700 font-bold">
            Edit
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight truncate">
            {article.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            <a
              href={`/insights/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-orange-700"
            >
              /insights/{article.slug}
            </a>
          </p>
        </div>
        <ArticleForm
          mode="edit"
          articleId={article.id}
          initial={{
            slug: article.slug,
            title: article.title,
            dek: article.dek,
            authorId: article.authorId,
            date: article.date,
            readingTime: String(article.readingTime),
            category: article.category,
            cover: article.cover,
            body: article.body,
            youtubeId: article.youtubeId ?? "",
            videoLabel: article.videoLabel ?? "",
            videoCredit: article.videoCredit ?? "",
            published: article.published,
          }}
        />
      </main>
    </div>
  );
}
