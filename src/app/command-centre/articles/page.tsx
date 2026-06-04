import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveContext } from "@/lib/auth";
import { getAllDbArticlesAdmin } from "@/lib/db-articles";
import GlassBackground from "../_components/GlassBackground";
import ArticleActions from "./_components/ArticleActions";

export const metadata: Metadata = {
  title: "Articles CMS · BuildHawk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ArticlesCmsPage() {
  const ctx = await getActiveContext().catch(() => null);
  if (!ctx) redirect("/command-centre/login?next=/command-centre/articles");

  const articles = await getAllDbArticlesAdmin();

  return (
    <div className="min-h-screen text-slate-900">
      <GlassBackground tone="light" />

      <header className="relative border-b border-white/40 bg-white/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href="/command-centre"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Console
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">Articles</span>
          <div className="flex-1" />
          <Link
            href="/command-centre/articles/new"
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg"
          >
            + New article
          </Link>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-orange-700 font-bold">
            Content management
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">Articles</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create and publish articles that appear instantly on the site — no rebuild needed.
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20 bg-white/50 border border-slate-200 rounded-xl">
            <p className="text-slate-500 text-sm">No articles yet.</p>
            <Link
              href="/command-centre/articles/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg"
            >
              Write your first article
            </Link>
          </div>
        ) : (
          <div className="bg-white/60 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold hidden sm:table-cell">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 leading-tight">{a.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{a.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{a.category}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{a.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          a.published
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {a.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ArticleActions
                        id={a.id}
                        slug={a.slug}
                        published={a.published}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
