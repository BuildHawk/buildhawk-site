/**
 * Short-lived signed tokens for Peace of Mind file downloads.
 *
 * Files live in Vercel Blob with random-suffix URLs (practically un-enumerable),
 * but ops emails are forwardable so we don't want raw Blob URLs in them. The
 * ops email instead contains tokenised URLs that hit /api/peace-of-mind/file,
 * which validates the HMAC + expiry and proxies the file from Blob.
 *
 * Token shape (Base64URL-encoded JSON):
 *   { p: pathname, n: download filename, e: unix-seconds exp, s: hmac }
 */

const ENCODER = new TextEncoder();

function base64urlEncode(bytes: Uint8Array): string {
  const s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey | null> {
  const secret = process.env.BH_AUTH_SECRET;
  if (!secret) return null;
  return crypto.subtle.importKey(
    "raw",
    ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export type FileTokenPayload = {
  /** Blob pathname returned by put(). */
  pathname: string;
  /** Original filename for the download disposition. */
  name: string;
  /** Token lifetime in seconds. */
  ttlSeconds: number;
};

export async function signFileToken(payload: FileTokenPayload): Promise<string | null> {
  const key = await hmacKey();
  if (!key) {
    console.warn("[peace-of-mind/file-tokens] BH_AUTH_SECRET missing - cannot sign");
    return null;
  }
  const exp = Math.floor(Date.now() / 1000) + payload.ttlSeconds;
  const body = JSON.stringify({ p: payload.pathname, n: payload.name, e: exp });
  const bodyBytes = ENCODER.encode(body);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, bodyBytes));
  return `${base64urlEncode(bodyBytes)}.${base64urlEncode(sig)}`;
}

export type VerifiedFileToken = {
  pathname: string;
  name: string;
  exp: number;
};

export async function verifyFileToken(token: string): Promise<VerifiedFileToken | null> {
  const key = await hmacKey();
  if (!key) return null;
  const [bodyB64, sigB64] = token.split(".");
  if (!bodyB64 || !sigB64) return null;
  let bodyBytes: Uint8Array;
  let sigBytes: Uint8Array;
  try {
    bodyBytes = base64urlDecode(bodyB64);
    sigBytes = base64urlDecode(sigB64);
  } catch {
    return null;
  }
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes as BufferSource,
    bodyBytes as BufferSource,
  );
  if (!ok) return null;
  let parsed: { p?: string; n?: string; e?: number };
  try {
    parsed = JSON.parse(new TextDecoder().decode(bodyBytes));
  } catch {
    return null;
  }
  if (!parsed.p || !parsed.n || typeof parsed.e !== "number") return null;
  if (parsed.e < Math.floor(Date.now() / 1000)) return null;
  return { pathname: parsed.p, name: parsed.n, exp: parsed.e };
}
