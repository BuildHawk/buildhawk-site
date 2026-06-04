import { NextResponse } from "next/server";
import { getActiveContext } from "@/lib/auth";
import {
  getDbArticleById,
  updateDbArticle,
  deleteDbArticle,
  togglePublished,
} from "@/lib/db-articles";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const ctx = await getActiveContext().catch(() => null);
  if (!ctx) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const article = await getDbArticleById(id);
  if (!article) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, article });
}

export async function PUT(req: Request, { params }: { params: Params }) {
  const ctx = await getActiveContext().catch(() => null);
  if (!ctx) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const VALID_AUTHORS = ["nathan", "jc"];
  const VALID_CATEGORIES = ["Methodology", "Field Notes", "Founder", "Operator Handbook"];

  if (body.authorId && !VALID_AUTHORS.includes(String(body.authorId))) {
    return NextResponse.json({ ok: false, error: "Invalid authorId" }, { status: 400 });
  }
  if (body.category && !VALID_CATEGORIES.includes(String(body.category))) {
    return NextResponse.json({ ok: false, error: "Invalid category" }, { status: 400 });
  }

  const updated = await updateDbArticle(id, {
    ...(body.slug !== undefined ? { slug: String(body.slug) } : {}),
    ...(body.title !== undefined ? { title: String(body.title) } : {}),
    ...(body.dek !== undefined ? { dek: String(body.dek) } : {}),
    ...(body.authorId !== undefined ? { authorId: String(body.authorId) } : {}),
    ...(body.date !== undefined ? { date: String(body.date) } : {}),
    ...(body.readingTime !== undefined ? { readingTime: Number(body.readingTime) } : {}),
    ...(body.category !== undefined ? { category: String(body.category) } : {}),
    ...(body.cover !== undefined ? { cover: String(body.cover) } : {}),
    ...(body.body !== undefined ? { body: String(body.body) } : {}),
    ...(body.published !== undefined ? { published: Boolean(body.published) } : {}),
    youtubeId: body.youtubeId ? String(body.youtubeId) : undefined,
    videoLabel: body.videoLabel ? String(body.videoLabel) : undefined,
    videoSrc: body.videoSrc ? String(body.videoSrc) : undefined,
    videoPoster: body.videoPoster ? String(body.videoPoster) : undefined,
    videoCredit: body.videoCredit ? String(body.videoCredit) : undefined,
  });

  if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, article: updated });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const ctx = await getActiveContext().catch(() => null);
  if (!ctx) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteDbArticle(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(_req: Request, { params }: { params: Params }) {
  const ctx = await getActiveContext().catch(() => null);
  if (!ctx) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const updated = await togglePublished(id);
  if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, article: updated });
}
