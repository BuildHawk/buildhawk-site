/**
 * Per-IP in-memory rate limiting.
 *
 * In-memory is adequate for a single Vercel instance at current traffic;
 * revisit with Vercel KV / Upstash if a route gets popular or scales to
 * multiple instances (each instance keeps its own counters).
 *
 * Buckets are namespaced so unrelated routes don't share a counter — e.g.
 * the auth bucket's budget is independent of the waitlist bucket's.
 */

type Bucket = { count: number; resetAt: number };

const stores = new Map<string, Map<string, Bucket>>();

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export interface RateLimitOptions {
  /** Sliding window length in ms. Default 15 minutes. */
  windowMs?: number;
  /** Max requests per key per window. Default 30. */
  max?: number;
  /** Namespace so different routes keep independent counters. Default "default". */
  bucket?: string;
}

export function rateLimit(
  key: string,
  opts: RateLimitOptions = {},
): { ok: boolean; retryAfter?: number } {
  const windowMs = opts.windowMs ?? 15 * 60 * 1000;
  const max = opts.max ?? 30;
  const bucketName = opts.bucket ?? "default";

  let hits = stores.get(bucketName);
  if (!hits) {
    hits = new Map<string, Bucket>();
    stores.set(bucketName, hits);
  }

  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  entry.count += 1;
  if (entry.count > max) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}

/** Standard 429 JSON response with an optional Retry-After header. */
export function tooManyRequests(retryAfter?: number): Response {
  return Response.json(
    { ok: false, error: "Too many requests. Please slow down and try again shortly." },
    {
      status: 429,
      headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined,
    },
  );
}
