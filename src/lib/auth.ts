/**
 * Magic-link auth for the BuildHawk SaaS.
 *
 * Self-serve signup. Users are persisted in Postgres; sessions carry a userId
 * and an active tenantId. Magic-link tokens are stored hashed in the DB so
 * we can revoke and prevent replay.
 *
 * Required env vars:
 *   BH_AUTH_SECRET   32+ char HMAC secret for signing session cookies.
 *   DATABASE_URL     Neon Postgres connection string.
 *   RESEND_API_KEY   Resend transactional email key.
 *   NEXT_PUBLIC_SITE_URL  Public origin.
 */

import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, isDbConfigured } from "@/lib/db/client";
import { magicLinks, memberships, tenants, users } from "@/lib/db/schema";
import { ids } from "@/lib/db/ids";

const SESSION_COOKIE = "bh_session";
const SESSION_DAYS = 30;
const MAGIC_TTL_MS = 30 * 60 * 1000;

const enc = new TextEncoder();
const dec = new TextDecoder();

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  Buffer.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const fromB64url = (s: string) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
};

const getSecret = () => {
  const s = process.env.BH_AUTH_SECRET;
  if (!s || s.length < 16) return null;
  return s;
};

const sign = async (data: string): Promise<string> => {
  const secret = getSecret();
  if (!secret) throw new Error("BH_AUTH_SECRET not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(sig);
};

const verifySignature = async (data: string, sig: string): Promise<boolean> => {
  const expected = await sign(data);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
};

export type SessionPayload = {
  userId: string;
  tenantId: string;
  email: string;
  exp: number;
};

async function encodeSession(payload: SessionPayload): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await sign(body);
  return `${body}.${sig}`;
}

async function decodeSession(token: string): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!(await verifySignature(body, sig))) return null;
  try {
    const payload = JSON.parse(dec.decode(fromB64url(body))) as SessionPayload;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const isAuthConfigured = () =>
  Boolean(getSecret()) && isDbConfigured() && Boolean(process.env.RESEND_API_KEY);

/* ------------------------------------------------------------------ */
/* Lockdown gates                                                     */
/* ------------------------------------------------------------------ */
/**
 * BH_SIGNIN_ALLOWLIST  comma-separated emails. When set, only these emails
 *                      may receive magic links or complete signup. Invite
 *                      acceptance still works (admin-driven, bypasses gate).
 *                      Empty/unset = open SaaS, anyone can sign in / sign up.
 *
 * BH_DISABLE_SIGNUP    "true" = self-serve signup is closed. The signup
 *                      endpoint refuses with a friendly message and the
 *                      signup page renders a "By invitation only" notice.
 */

export const isSignupDisabled = () =>
  process.env.BH_DISABLE_SIGNUP?.toLowerCase() === "true";

export function isSigninAllowed(email: string): boolean {
  const list = process.env.BH_SIGNIN_ALLOWLIST;
  if (!list) return true; // open mode
  const allowed = list.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(normalizeEmail(email));
}

/**
 * BH_ADMIN_EMAILS  comma-separated emails permitted to manage the GLOBAL CMS
 *                  (articles). The CMS is not tenant-scoped, so write/read of
 *                  drafts must be restricted to platform operators — being
 *                  signed into any tenant is NOT sufficient.
 *
 * Fail-closed: when unset, NO ONE is a platform admin (article management is
 * disabled until the allowlist is configured in the environment).
 */
export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = process.env.BH_ADMIN_EMAILS;
  if (!list) return false; // no admins configured -> deny
  const allowed = list.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(normalizeEmail(email));
}

/* ------------------------------------------------------------------ */
/* Session cookie                                                     */
/* ------------------------------------------------------------------ */

export async function setSession(payload: Omit<SessionPayload, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const token = await encodeSession({ ...payload, exp });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (!t) return null;
  return decodeSession(t);
}

export async function getSessionEmail(): Promise<string | null> {
  const s = await getSession();
  return s?.email ?? null;
}

/* ------------------------------------------------------------------ */
/* Magic-link issue + consume                                         */
/* ------------------------------------------------------------------ */

export type MagicPurpose = "signin" | "signup" | "invite";

export async function issueMagicLink(opts: {
  email: string;
  purpose: MagicPurpose;
  redirect?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const email = normalizeEmail(opts.email);
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + MAGIC_TTL_MS);
  await db()
    .insert(magicLinks)
    .values({
      id: ids.magicLink(),
      tokenHash,
      email,
      purpose: opts.purpose,
      redirect: opts.redirect ?? null,
      metadata: opts.metadata ?? null,
      expiresAt,
    });
  return rawToken;
}

export async function consumeMagicLink(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const [row] = await db()
    .select()
    .from(magicLinks)
    .where(
      and(
        eq(magicLinks.tokenHash, tokenHash),
        gt(magicLinks.expiresAt, now),
        isNull(magicLinks.consumedAt),
      ),
    )
    .limit(1);
  if (!row) return null;
  await db()
    .update(magicLinks)
    .set({ consumedAt: now })
    .where(eq(magicLinks.id, row.id));
  return row;
}

/* ------------------------------------------------------------------ */
/* User + tenant resolution                                           */
/* ------------------------------------------------------------------ */

export async function findOrCreateUser(email: string, name?: string) {
  const e = normalizeEmail(email);
  const existing = await db().select().from(users).where(eq(users.email, e)).limit(1);
  if (existing[0]) return existing[0];
  const id = ids.user();
  const [created] = await db()
    .insert(users)
    .values({ id, email: e, name: name ?? null, emailVerified: true })
    .returning();
  return created;
}

export async function getActiveContext() {
  const session = await getSession();
  if (!session) return null;
  const user = (
    await db().select().from(users).where(eq(users.id, session.userId)).limit(1)
  )[0];
  if (!user) return null;
  const tenant = (
    await db().select().from(tenants).where(eq(tenants.id, session.tenantId)).limit(1)
  )[0];
  if (!tenant) return null;
  const membership = (
    await db()
      .select()
      .from(memberships)
      .where(and(eq(memberships.tenantId, tenant.id), eq(memberships.userId, user.id)))
      .limit(1)
  )[0];
  if (!membership) return null;
  return { user, tenant, membership };
}

export async function listUserTenants(userId: string) {
  return db()
    .select({
      tenant: tenants,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(eq(memberships.userId, userId));
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
