"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Methodology", "Operator Handbook", "Field Notes", "Founder"] as const;
const AUTHORS = [
  { id: "nathan", label: "Nathan Holloway" },
  { id: "jc", label: "John Ceballos" },
] as const;

const BODY_STOP_PREFIXES = [
  "## meta title",
  "## meta description",
  "## image metadata",
  "## alternate title",
  "## suggestion",
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function estimateReadingTime(body: string) {
  return Math.max(1, Math.round(body.split(/\s+/).length / 200));
}

function parseLooseMarkdown(raw: string): Partial<FormState> {
  const lines = raw.split(/\r?\n/);
  let i = 0;
  let cover = "";

  const first = lines[0]?.trim() ?? "";
  if (first.startsWith("http://") || first.startsWith("https://") || first.startsWith("/")) {
    cover = first;
    i = 1;
  }

  while (i < lines.length && !lines[i]?.trim()) i++;

  let title = "";
  if (lines[i]?.trim().startsWith("# ")) {
    title = lines[i]!.trim().slice(2).trim();
    i++;
  }

  while (i < lines.length && !lines[i]?.trim()) i++;

  let dek = "";
  if (lines[i]?.trim().startsWith("## ")) {
    dek = lines[i]!.trim().slice(3).trim();
    i++;
  }

  const bodyLines: string[] = [];
  for (; i < lines.length; i++) {
    const trimmed = lines[i]!.trim().toLowerCase();
    if (BODY_STOP_PREFIXES.some((p) => trimmed.startsWith(p))) break;
    const line = lines[i]!;
    bodyLines.push(/^(\s*)-\s+/.test(line) ? line.replace(/^(\s*)-\s+/, "• ") : line);
  }

  const body = bodyLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  return {
    title,
    dek,
    cover,
    body,
    slug: slugify(title),
    readingTime: body ? String(estimateReadingTime(body)) : "5",
  };
}

type FormState = {
  slug: string;
  title: string;
  dek: string;
  authorId: string;
  date: string;
  readingTime: string;
  category: string;
  cover: string;
  body: string;
  youtubeId: string;
  videoLabel: string;
  videoCredit: string;
  published: boolean;
};

type Props = {
  mode: "create" | "edit";
  articleId?: string;
  initial?: Partial<FormState>;
};

const inputCls =
  "mt-1 w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400";
const labelCls = "block text-[11px] uppercase tracking-wider text-slate-500 font-semibold";

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className={labelCls}>
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
  </label>
);

export default function ArticleForm({ mode, articleId, initial }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<FormState>({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    dek: initial?.dek ?? "",
    authorId: initial?.authorId ?? "nathan",
    date: initial?.date ?? today,
    readingTime: initial?.readingTime ?? "5",
    category: initial?.category ?? "Field Notes",
    cover: initial?.cover ?? "",
    body: initial?.body ?? "",
    youtubeId: initial?.youtubeId ?? "",
    videoLabel: initial?.videoLabel ?? "",
    videoCredit: initial?.videoCredit ?? "",
    published: initial?.published ?? false,
  });

  const [rawImport, setRawImport] = useState("");
  const [showImport, setShowImport] = useState(mode === "create");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleTitleChange = (v: string) => {
    setForm((f) => ({
      ...f,
      title: v,
      slug: mode === "create" ? slugify(v) : f.slug,
    }));
  };

  const handleImport = () => {
    if (!rawImport.trim()) return;
    const parsed = parseLooseMarkdown(rawImport);
    setForm((f) => ({
      ...f,
      ...parsed,
      authorId: f.authorId,
      date: f.date,
      category: f.category,
      published: f.published,
      youtubeId: f.youtubeId,
      videoLabel: f.videoLabel,
      videoCredit: f.videoCredit,
    }));
    setRawImport("");
    setShowImport(false);
  };

  const handleSave = async (publish?: boolean) => {
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        readingTime: parseInt(form.readingTime, 10) || 5,
        published: publish !== undefined ? publish : form.published,
      };

      const url =
        mode === "create"
          ? "/api/command-centre/articles"
          : `/api/command-centre/articles/${articleId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Save failed");
      router.push("/command-centre/articles");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Import helper */}
      <div className="bg-white/60 border border-slate-200 rounded-xl p-5">
        <button
          type="button"
          onClick={() => setShowImport((v) => !v)}
          className="flex items-center gap-2 text-[12px] uppercase tracking-wider font-semibold text-slate-500 hover:text-slate-800"
        >
          <span>{showImport ? "▼" : "▶"}</span>
          Paste &amp; parse markdown
        </button>
        {showImport && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-slate-500">
              Paste a raw markdown file — image URL on line 1, then # Title, ## Subtitle, body.
              Fields will be auto-filled.
            </p>
            <textarea
              value={rawImport}
              onChange={(e) => setRawImport(e.target.value)}
              rows={8}
              placeholder="Paste raw markdown here…"
              className={inputCls + " font-mono text-xs"}
            />
            <button
              type="button"
              onClick={handleImport}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm rounded-lg"
            >
              Parse into form
            </button>
          </div>
        )}
      </div>

      {/* Core fields */}
      <div className="bg-white/60 border border-slate-200 rounded-xl p-5 space-y-5">
        <h2 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100 pb-3">
          Article details
        </h2>
        <Field label="Title" required>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Article title"
            className={inputCls}
          />
        </Field>
        <Field label="URL slug" required>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="url-slug"
            className={inputCls + " font-mono"}
          />
          <span className="block text-[11px] text-slate-400 mt-1">
            /insights/{form.slug || "url-slug"}
          </span>
        </Field>
        <Field label="Summary / dek" required>
          <textarea
            value={form.dek}
            onChange={(e) => set("dek", e.target.value)}
            rows={2}
            placeholder="Two or three sentences shown on article cards and in search."
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Author" required>
            <select
              value={form.authorId}
              onChange={(e) => set("authorId", e.target.value)}
              className={inputCls}
            >
              {AUTHORS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" required>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date" required>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Reading time (min)">
            <input
              type="number"
              min={1}
              max={60}
              value={form.readingTime}
              onChange={(e) => set("readingTime", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Cover image URL" required>
          <input
            type="text"
            value={form.cover}
            onChange={(e) => set("cover", e.target.value)}
            placeholder="https://… or /brand/cover-sitework.svg?v=2"
            className={inputCls}
          />
        </Field>
        {form.cover && (
          <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 aspect-[16/5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.cover}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="bg-white/60 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Article body
          </h2>
          <span className="text-[11px] text-slate-400">
            ~{estimateReadingTime(form.body)} min read · {form.body.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Syntax: <code>## H2</code> · <code>### H3</code> · <code>&gt; pull quote</code> ·{" "}
          <code>• bullet</code> · <code>---</code> divider · <code>**bold**</code>
        </p>
        <textarea
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          rows={28}
          placeholder={"Opening paragraph...\n\n## First heading\n\nSection content..."}
          className={inputCls + " font-mono text-xs leading-relaxed"}
        />
      </div>

      {/* Optional video */}
      <div className="bg-white/60 border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100 pb-3">
          Video (optional)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="YouTube ID">
            <input
              type="text"
              value={form.youtubeId}
              onChange={(e) => set("youtubeId", e.target.value)}
              placeholder="dQw4w9WgXcQ"
              className={inputCls}
            />
          </Field>
          <Field label="Video label">
            <input
              type="text"
              value={form.videoLabel}
              onChange={(e) => set("videoLabel", e.target.value)}
              placeholder="Featured walkthrough"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Video credit">
          <input
            type="text"
            value={form.videoCredit}
            onChange={(e) => set("videoCredit", e.target.value)}
            placeholder="Featured talk · Speaker Name"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => set("published", !form.published)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              form.published ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.published ? "translate-x-4" : ""
              }`}
            />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {form.published ? "Published" : "Draft"}
          </span>
        </label>

        {error && <p className="text-sm text-rose-600 flex-1">{error}</p>}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          {!form.published && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
            >
              {saving ? "Saving…" : "Save & Publish"}
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
          >
            {saving ? "Saving…" : mode === "create" ? "Save draft" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
