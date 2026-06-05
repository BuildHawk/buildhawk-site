import fs from "fs";
import path from "path";
import type { Article } from "./articles";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

const BODY_STOP_PREFIXES = [
  "## meta title",
  "## meta description",
  "## image metadata",
  "## alternate title",
  "## suggestion",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugFromText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function slugFromFilename(filename: string): string {
  return slugFromText(filename.replace(/\.md$/i, ""));
}

function estimateReadingTime(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

// Map any author string to a valid authorId
function resolveAuthorId(author: string | undefined): Article["authorId"] {
  if (!author) return "nathan";
  const a = author.toLowerCase();
  if (a.includes("jc") || a.includes("john") || a.includes("ceballos")) return "jc";
  return "nathan";
}

function convertBodyLine(line: string): string {
  return /^(\s*)-\s+/.test(line) ? line.replace(/^(\s*)-\s+/, "• ") : line;
}

// ─── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  rest: string;
} | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonAt = line.indexOf(":");
    if (colonAt === -1) continue;
    const key = line.slice(0, colonAt).trim().toLowerCase();
    const val = line.slice(colonAt + 1).trim();
    if (key) data[key] = val;
  }
  return { data, rest: match[2] };
}

// ─── Full frontmatter path (all required fields present) ─────────────────────

function articleFromFullFrontmatter(
  data: Record<string, string>,
  body: string
): Article | null {
  const { slug, title, dek, authorid, date, readingtime, category, cover } = data;
  const resolvedAuthorId = authorid ?? data["authorid"];
  if (!slug || !title || !dek || !date || !category || !cover) return null;
  if (resolvedAuthorId !== "nathan" && resolvedAuthorId !== "jc") return null;
  if (!["Methodology", "Field Notes", "Founder", "Operator Handbook"].includes(category)) return null;

  return {
    slug,
    title,
    dek,
    authorId: resolvedAuthorId as Article["authorId"],
    date,
    readingTime: readingtime ? parseInt(readingtime, 10) : estimateReadingTime(body),
    category: category as Article["category"],
    cover,
    body,
    ...(data.youtubeid && { youtubeId: data.youtubeid }),
    ...(data.videolabel && { videoLabel: data.videolabel }),
    ...(data.videosrc && { videoSrc: data.videosrc }),
    ...(data.videoposter && { videoPoster: data.videoposter }),
    ...(data.videocredit && { videoCredit: data.videocredit }),
  };
}

// ─── Loose body parser ────────────────────────────────────────────────────────
// Reads: optional image URL, # Title, ## Dek, body (stops at SEO sections)

function parseLooseBody(text: string): {
  cover: string | null;
  h1: string | null;
  h2: string | null;
  body: string;
} {
  const lines = text.split(/\r?\n/);
  let i = 0;
  let cover: string | null = null;
  let h1: string | null = null;
  let h2: string | null = null;

  // Optional image URL on first non-blank line
  while (i < lines.length && !lines[i]?.trim()) i++;
  const first = lines[i]?.trim() ?? "";
  if (first.startsWith("http://") || first.startsWith("https://") || first.startsWith("/")) {
    cover = first;
    i++;
  }

  // Skip blanks
  while (i < lines.length && !lines[i]?.trim()) i++;

  // H1 → article title
  if (lines[i]?.trim().startsWith("# ")) {
    h1 = lines[i]!.trim().slice(2).trim();
    i++;
  }

  // Skip blanks
  while (i < lines.length && !lines[i]?.trim()) i++;

  // First H2 → dek
  if (lines[i]?.trim().startsWith("## ")) {
    h2 = lines[i]!.trim().slice(3).trim();
    i++;
  }

  // Body until stop marker
  const bodyLines: string[] = [];
  for (; i < lines.length; i++) {
    const trimmed = lines[i]!.trim().toLowerCase();
    if (BODY_STOP_PREFIXES.some((p) => trimmed.startsWith(p))) break;
    bodyLines.push(convertBodyLine(lines[i]!));
  }

  const body = bodyLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { cover, h1, h2, body };
}

// ─── Main per-file resolver ───────────────────────────────────────────────────

function articleFromFile(
  raw: string,
  filename: string,
  mtime: Date
): Article | null {
  const fm = parseFrontmatter(raw);

  if (fm) {
    const { data, rest } = fm;

    // Path A: full frontmatter with all required fields
    const full = articleFromFullFrontmatter(data, rest.trim());
    if (full) return full;

    // Path B: partial frontmatter (title / date / author) + loose body
    const loose = parseLooseBody(rest);
    const title = data.title || loose.h1;
    if (!title) return null;

    const dek = loose.h2 ?? title;
    const cover = loose.cover ?? "/brand/cover-sitework.svg?v=2";
    const body = loose.body;
    if (!body) return null;

    return {
      slug: data.slug ?? slugFromFilename(filename),
      title,
      dek,
      authorId: resolveAuthorId(data.author ?? data.authorid),
      date: data.date ?? mtime.toISOString().slice(0, 10),
      readingTime: data.readingtime
        ? parseInt(data.readingtime, 10)
        : estimateReadingTime(body),
      category: (data.category as Article["category"]) ?? "Field Notes",
      cover,
      body,
      ...(data.youtubeid && { youtubeId: data.youtubeid }),
      ...(data.videolabel && { videoLabel: data.videolabel }),
    };
  }

  // Path C: no frontmatter at all — pure loose format
  const loose = parseLooseBody(raw);
  const title = loose.h1;
  if (!title || !loose.body) return null;

  return {
    slug: slugFromFilename(filename),
    title,
    dek: loose.h2 ?? title,
    authorId: "nathan",
    date: mtime.toISOString().slice(0, 10),
    readingTime: estimateReadingTime(loose.body),
    category: "Field Notes",
    cover: loose.cover ?? "/brand/cover-sitework.svg?v=2",
    body: loose.body,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getMarkdownArticles(): Article[] {
  try {
    const files = fs
      .readdirSync(CONTENT_DIR)
      .filter((f) => f.toLowerCase().endsWith(".md"));

    const results: Article[] = [];

    for (const file of files) {
      try {
        const filepath = path.join(CONTENT_DIR, file);
        const raw = fs.readFileSync(filepath, "utf-8");
        const mtime = fs.statSync(filepath).mtime;
        const article = articleFromFile(raw, file, mtime);
        if (article) results.push(article);
      } catch {
        // skip unreadable / malformed files
      }
    }

    return results;
  } catch {
    return [];
  }
}
