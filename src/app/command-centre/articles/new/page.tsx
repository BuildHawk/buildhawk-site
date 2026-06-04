import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveContext } from "@/lib/auth";
import GlassBackground from "../../_components/GlassBackground";
import ArticleForm from "../_components/ArticleForm";

export const metadata: Metadata = {
  title: "New article · BuildHawk CMS",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const ctx = await getActiveContext().catch(() => null);
  if (!ctx) redirect("/command-centre/login?next=/command-centre/articles/new");

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
          <span className="text-sm font-medium text-slate-900">New article</span>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-orange-700 font-bold">
            Create
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">New article</h1>
        </div>
        <ArticleForm mode="create" />
      </main>
    </div>
  );
}
