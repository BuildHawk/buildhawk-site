/**
 * Email + password sign-in.
 *
 * Verifies the credentials against users.password_hash. On success: resolves
 * the user's primary tenant membership and sets a session cookie.
 *
 * Lockdown applies: emails not on BH_SIGNIN_ALLOWLIST get a generic 401, no
 * leak of whether the account exists. Same response if the email exists but
 * has no password set yet — they need to use the magic link path first to set
 * one.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  isAuthConfigured,
  isSigninAllowed,
  listUserTenants,
  normalizeEmail,
  setSession,
} from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/passwords";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

// Return a fresh Response per call; reusing a NextResponse instance consumes
// its body stream on first send and subsequent requests get an empty body.
const genericFail = () =>
  NextResponse.json({ ok: false, error: "Email or password is incorrect" }, { status: 401 });

export async function POST(req: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Auth not configured." },
      { status: 503 },
    );
  }
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return genericFail();
  }
  if (!password || password.length < 8) {
    return genericFail();
  }
  if (!isSigninAllowed(email)) {
    return genericFail();
  }

  const user = (
    await db().select().from(users).where(eq(users.email, email)).limit(1)
  )[0];
  if (!user || !user.passwordHash) {
    return genericFail();
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return genericFail();
  }

  const memberRows = await listUserTenants(user.id);
  const tenantId = memberRows[0]?.tenant.id;
  if (!tenantId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Your account isn't attached to a workspace yet. Contact your administrator.",
      },
      { status: 403 },
    );
  }

  await setSession({ userId: user.id, tenantId, email: user.email });
  await db()
    .update(users)
    .set({ lastSignedInAt: new Date() })
    .where(eq(users.id, user.id));

  recordAudit({
    tenantId,
    actorUserId: user.id,
    actorEmail: user.email,
    action: "auth.password.signin",
    target: user.id,
  });

  return NextResponse.json({ ok: true });
}
