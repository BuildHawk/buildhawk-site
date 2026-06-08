import { NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { verifyFileToken } from "@/lib/peace-of-mind/file-tokens";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/peace-of-mind/file?t=<token>
 *
 * Validates the HMAC + expiry on the token, then streams the file from Vercel
 * Blob with a Content-Disposition that preserves the original filename. This
 * keeps raw Blob URLs out of forwarded ops emails and adds a 7-day expiry
 * window on each download link.
 *
 * Returns 401 on bad/expired token, 404 if the underlying Blob is gone,
 * 503 if BLOB_READ_WRITE_TOKEN is unset.
 */
export async function GET(req: Request) {
  // Rate-limit per IP to discourage token-guessing brute force.
  const rl = rateLimit(clientIp(req), { bucket: "peace-of-mind-file", max: 60 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });
  }

  const verified = await verifyFileToken(token);
  if (!verified) {
    return NextResponse.json(
      { ok: false, error: "Link invalid or expired." },
      { status: 401 },
    );
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json(
      { ok: false, error: "Storage not configured." },
      { status: 503 },
    );
  }

  let blobMeta: { url: string; contentType?: string; size: number } | null = null;
  try {
    blobMeta = await head(verified.pathname, { token: blobToken });
  } catch (err) {
    console.warn("[peace-of-mind/file] blob head failed:", err);
    return NextResponse.json({ ok: false, error: "File not found." }, { status: 404 });
  }
  if (!blobMeta) {
    return NextResponse.json({ ok: false, error: "File not found." }, { status: 404 });
  }

  // Stream the file through. We could 302 to the Blob URL, but proxying keeps
  // the raw URL hidden from the recipient (they only ever see /api/...?t=...).
  const upstream = await fetch(blobMeta.url);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { ok: false, error: "Could not retrieve file." },
      { status: 502 },
    );
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    blobMeta.contentType || "application/octet-stream",
  );
  headers.set("Content-Length", String(blobMeta.size));
  // RFC 5987 filename* handles unicode filenames safely.
  const asciiName = verified.name.replace(/[^\x20-\x7E]/g, "_");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(verified.name)}`,
  );
  headers.set("Cache-Control", "private, no-store");

  return new Response(upstream.body, { status: 200, headers });
}
