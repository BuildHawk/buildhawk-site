"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ArticleActions({
  id,
  slug,
  published,
}: {
  id: string;
  slug: string;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    await fetch(`/api/command-centre/articles/${id}`, { method: "PATCH" });
    router.refresh();
    setBusy(false);
  };

  const del = async () => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    setBusy(true);
    await fetch(`/api/command-centre/articles/${id}`, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <a
        href={`/insights/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] text-slate-500 hover:text-slate-800 underline underline-offset-2"
      >
        Preview
      </a>
      <Link
        href={`/command-centre/articles/${id}/edit`}
        className="text-[12px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
      >
        Edit
      </Link>
      <button
        onClick={toggle}
        disabled={busy}
        className={`text-[12px] px-2.5 py-1 rounded-md disabled:opacity-40 ${
          published
            ? "bg-amber-100 hover:bg-amber-200 text-amber-800"
            : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
        }`}
      >
        {published ? "Unpublish" : "Publish"}
      </button>
      <button
        onClick={del}
        disabled={busy}
        className="text-[12px] px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-md disabled:opacity-40"
      >
        Delete
      </button>
    </div>
  );
}
