import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/auth";
import { getAllDbArticlesAdmin, createDbArticle } from "@/lib/db-articles";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getActiveContext().catch(() => null);
  if (!ctx) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const articles = await getAllDbArticlesAdmin();
  return NextResponse.json({ ok: true, articles });
}

export async function POST(req: Request) {
  const ctx = await getActiveContext().catch(() => null);
  if (!ctx) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["slug", "title", "dek", "authorId", "date", "category", "cover", "body"];
  for (const k of required) {
    if (!body[k]) return NextResponse.json({ ok: false, error: `Missing: ${k}` }, { status: 400 });
  }

  const VALID_AUTHORS = ["nathan", "jc"];
  const VALID_CATEGORIES = ["Methodology", "Field Notes", "Founder", "Operator Handbook"];

  if (!VALID_AUTHORS.includes(String(body.authorId))) {
    return NextResponse.json({ ok: false, error: "Invalid authorId" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(String(body.category))) {
    return NextResponse.json({ ok: false, error: "Invalid category" }, { status: 400 });
  }

  const article = await createDbArticle({
    slug: String(body.slug),
    title: String(body.title),
    dek: String(body.dek),
    authorId: String(body.authorId),
    date: String(body.date),
    readingTime: Number(body.readingTime) || 5,
    category: String(body.category),
    cover: String(body.cover),
    body: String(body.body),
    published: Boolean(body.published),
    ...(body.youtubeId ? { youtubeId: String(body.youtubeId) } : {}),
    ...(body.videoLabel ? { videoLabel: String(body.videoLabel) } : {}),
    ...(body.videoSrc ? { videoSrc: String(body.videoSrc) } : {}),
    ...(body.videoPoster ? { videoPoster: String(body.videoPoster) } : {}),
    ...(body.videoCredit ? { videoCredit: String(body.videoCredit) } : {}),
  });

  return NextResponse.json({ ok: true, article }, { status: 201 });
}
