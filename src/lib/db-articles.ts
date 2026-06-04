import { eq, desc } from "drizzle-orm";
import { db, schema } from "./db/client";
import { ids } from "./db/ids";
import type { Article } from "./articles";

type Row = typeof schema.cmsArticles.$inferSelect;

function rowToArticle(r: Row): Article {
  return {
    slug: r.slug,
    title: r.title,
    dek: r.dek,
    authorId: r.authorId as Article["authorId"],
    date: r.date,
    readingTime: r.readingTime,
    category: r.category as Article["category"],
    cover: r.cover,
    body: r.body,
    ...(r.youtubeId ? { youtubeId: r.youtubeId } : {}),
    ...(r.videoLabel ? { videoLabel: r.videoLabel } : {}),
    ...(r.videoSrc ? { videoSrc: r.videoSrc } : {}),
    ...(r.videoPoster ? { videoPoster: r.videoPoster } : {}),
    ...(r.videoCredit ? { videoCredit: r.videoCredit } : {}),
  };
}

export async function getPublishedDbArticles(): Promise<Article[]> {
  try {
    if (!process.env.DATABASE_URL) return [];
    const rows = await db()
      .select()
      .from(schema.cmsArticles)
      .where(eq(schema.cmsArticles.published, true));
    return rows.map(rowToArticle);
  } catch {
    return [];
  }
}

export async function getAllDbArticlesAdmin(): Promise<Row[]> {
  if (!process.env.DATABASE_URL) return [];
  return db()
    .select()
    .from(schema.cmsArticles)
    .orderBy(desc(schema.cmsArticles.createdAt));
}

export async function getDbArticleById(id: string): Promise<Row | null> {
  if (!process.env.DATABASE_URL) return null;
  const rows = await db()
    .select()
    .from(schema.cmsArticles)
    .where(eq(schema.cmsArticles.id, id));
  return rows[0] ?? null;
}

export type ArticleInput = {
  slug: string;
  title: string;
  dek: string;
  authorId: string;
  date: string;
  readingTime: number;
  category: string;
  cover: string;
  body: string;
  youtubeId?: string;
  videoLabel?: string;
  videoSrc?: string;
  videoPoster?: string;
  videoCredit?: string;
  published?: boolean;
};

export async function createDbArticle(input: ArticleInput): Promise<Row> {
  const [row] = await db()
    .insert(schema.cmsArticles)
    .values({ id: ids.article(), ...input })
    .returning();
  return row!;
}

export async function updateDbArticle(
  id: string,
  input: Partial<ArticleInput>
): Promise<Row | null> {
  const [row] = await db()
    .update(schema.cmsArticles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.cmsArticles.id, id))
    .returning();
  return row ?? null;
}

export async function deleteDbArticle(id: string): Promise<void> {
  await db()
    .delete(schema.cmsArticles)
    .where(eq(schema.cmsArticles.id, id));
}

export async function togglePublished(id: string): Promise<Row | null> {
  const existing = await getDbArticleById(id);
  if (!existing) return null;
  return updateDbArticle(id, { published: !existing.published });
}
