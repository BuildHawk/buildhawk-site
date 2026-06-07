/**
 * Set or change the signed-in user's password.
 *
 * - Requires an active session.
 * - If a password is already set, requires the current password in the body.
 * - Validates new password >= 8 chars and != current.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getActiveContext } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { recordAudit } from "@/lib/audit";

import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const _rl = rateLimit(clientIp(req), { bucket: "auth-set-password", max: 8 });
  if (!_rl.ok) return tooManyRequests(_rl.retryAfter);

  const ctx = await getActiveContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const newPassword = body.newPassword ?? "";
  if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 512) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const existing = (
    await db().select().from(users).where(eq(users.id, ctx.user.id)).limit(1)
  )[0];
  if (!existing) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  if (existing.passwordHash) {
    const current = body.currentPassword ?? "";
    if (!current) {
      return NextResponse.json(
        { ok: false, error: "Current password required" },
        { status: 400 },
      );
    }
    const ok = await verifyPassword(current, existing.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Current password is incorrect" },
        { status: 401 },
      );
    }
    if (current === newPassword) {
      return NextResponse.json(
        { ok: false, error: "New password must be different from the current one" },
        { status: 400 },
      );
    }
  }

  const hash = await hashPassword(newPassword);
  await db()
    .update(users)
    .set({ passwordHash: hash, passwordSetAt: new Date() })
    .where(eq(users.id, ctx.user.id));

  recordAudit({
    tenantId: ctx.tenant.id,
    actorUserId: ctx.user.id,
    actorEmail: ctx.user.email,
    action: existing.passwordHash ? "auth.password.changed" : "auth.password.set",
    target: ctx.user.id,
  });

  return NextResponse.json({ ok: true });
}
