import fs from "fs";
import path from "path";
import type { Article } from "./articles";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

// Sections that mark the end of article body in loose-format files
const BODY_STOP_PREFIXES = [
  "## meta title",
  "## meta description",
  "## image metadata",
  "## alternate title",
  "## suggestion",
];

function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function estimateReadingTime(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

// ─── YAML frontmatter parser ─────────────────────────────────────────────────

function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  body: string;
} | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonAt = line.indexOf(":");
    if (colonAt === -1) continue;
    const key = line.slice(0, colonAt).trim();
    const val = line.slice(colonAt + 1).trim();
    if (key) data[key] = val;
  }
  return { data, body: match[2].trim() };
}

function articleFromFrontmatter(
  raw: string,
  filename: string
): Article | null {
  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;
  const { data, body } = parsed;

  const { slug, title, dek, authorId, date, readingTime, category, cover } =
    data;
  if (!slug || !title || !dek || !authorId || !date || !category || !cover)
    return null;
  if (authorId !== "nathan" && authorId !== "jc") return null;
  if (
    category !== "Methodology" &&
    category !== "Field Notes" &&
    category !== "Founder" &&
    category !== "Operator Handbook"
  )
    return null;

  return {
    slug,
    title,
    dek,
    authorId: authorId as Article["authorId"],
    date,
    readingTime: readingTime ? parseInt(readingTime, 10) : estimateReadingTime(body),
    category: category as Article["category"],
    cover,
    body,
    ...(data.youtubeId && { youtubeId: data.youtubeId }),
    ...(data.videoLabel && { videoLabel: data.videoLabel }),
    ...(data.videoSrc && { videoSrc: data.videoSrc }),
    ...(data.videoPoster && { videoPoster: data.videoPoster }),
    ...(data.videoCredit && { videoCredit: data.videoCredit }),
  };
}

// ─── Loose format parser (no frontmatter) ────────────────────────────────────
//
// Expected shape:
//   Line 1 (optional): https://... or /path  →  cover image
//   # Title                                  →  title
//   ## First H2                              →  dek (subtitle)
//   ... rest of content ...                  →  body (until a stop marker)

function convertBodyLine(line: string): string {
  // Convert standard markdown "-" bullets to the site's "•" bullet syntax
  return /^(\s*)-\s+/.test(line) ? line.replace(/^(\s*)-\s+/, "• ") : line;
}

function articleFromLooseFormat(
  raw: string,
  filename: string,
  mtime: Date
): Article | null {
  const rawLines = raw.split(/\r?\n/);
  let i = 0;

  // Line 0: optional cover image URL
  let cover = "/brand/cover-sitework.svg?v=2";
  const firstLine = rawLines[0]?.trim() ?? "";
  if (firstLine.startsWith("http://") || firstLine.startsWith("https://") || firstLine.startsWith("/")) {
    cover = firstLine;
    i = 1;
  }

  // Skip blank lines
  while (i < rawLines.length && !rawLines[i]?.trim()) i++;

  // Find H1 → title
  let title = "";
  if (rawLines[i]?.trim().startsWith("# ")) {
    title = rawLines[i].trim().slice(2).trim();
    i++;
  }
  if (!title) return null;

  // Skip blank lines
  while (i < rawLines.length && !rawLines[i]?.trim()) i++;

  // Find first H2 → dek
  let dek = "";
  if (rawLines[i]?.trim().startsWith("## ")) {
    dek = rawLines[i].trim().slice(3).trim();
    i++;
  }
  if (!dek) dek = title;

  // Collect body lines until a stop marker
  const bodyLines: string[] = [];
  for (; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim().toLowerCase();
    if (BODY_STOP_PREFIXES.some((p) => trimmed.startsWith(p))) break;
    bodyLines.push(convertBodyLine(rawLines[i]));
  }

  const body = bodyLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // collapse excessive blank lines
    .trim();

  if (!body) return null;

  return {
    slug: slugFromFilename(filename),
    title,
    dek,
    authorId: "nathan",
    date: mtime.toISOString().slice(0, 10),
    readingTime: estimateReadingTime(body),
    category: "Field Notes",
    cover,
    body,
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

        const article =
          articleFromFrontmatter(raw, file) ??
          articleFromLooseFormat(raw, file, mtime);

        if (article) results.push(article);
      } catch {
        // skip files that can't be read or parsed
      }
    }

    return results;
  } catch {
    return [];
  }
}
