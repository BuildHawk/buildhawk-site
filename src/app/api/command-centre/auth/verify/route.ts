import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import {
  consumeMagicLink,
  findOrCreateUser,
  listUserTenants,
  setSession,
} from "@/lib/auth";
import { db } from "@/lib/db/client";
import { invitations, memberships, tenants, users } from "@/lib/db/schema";
import { ids } from "@/lib/db/ids";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const consumed = await consumeMagicLink(token);

  if (!consumed) {
    return NextResponse.redirect(
      new URL("/command-centre/login?error=expired", url.origin),
    );
  }

  const meta = (consumed.metadata ?? {}) as {
    name?: string;
    tenantName?: string;
    plan?: string;
    inviteId?: string;
  };

  const user = await findOrCreateUser(consumed.email, meta.name);

  let tenantId: string | null = null;

  // Signup path: provision a fresh tenant + owner membership.
  if (consumed.purpose === "signup" && meta.tenantName) {
    const { slugify } = await import("@/lib/db/ids");
    const slug = slugify(meta.tenantName);
    const tenantRow = (
      await db()
        .insert(tenants)
        .values({
          id: ids.tenant(),
          slug,
          name: meta.tenantName,
          plan: (meta.plan as "starter" | "pro" | "enterprise") ?? "starter",
          status: "trialing",
          trialEndsAt: new Date(Date.now() + 14 * 86400 * 1000),
        })
        .returning()
    )[0];
    await db()
      .insert(memberships)
      .values({
        id: ids.membership(),
        tenantId: tenantRow.id,
        userId: user.id,
        role: "owner",
      });
    tenantId = tenantRow.id;
    recordAudit({
      tenantId: tenantRow.id,
      actorUserId: user.id,
      actorEmail: user.email,
      action: "tenant.created",
      target: tenantRow.id,
      metadata: { plan: tenantRow.plan, name: tenantRow.name },
    });
  }

  // Invite path: accept invitation, become a member of the inviting tenant.
  if (consumed.purpose === "invite" && meta.inviteId) {
    const invite = (
      await db().select().from(invitations).where(eq(invitations.id, meta.inviteId)).limit(1)
    )[0];
    if (invite && invite.status === "pending" && invite.expiresAt > new Date()) {
      // Idempotent: do not duplicate memberships.
      const existing = (
        await db()
          .select()
          .from(memberships)
          .where(
            and(eq(memberships.tenantId, invite.tenantId), eq(memberships.userId, user.id)),
          )
          .limit(1)
      )[0];
      if (!existing) {
        await db().insert(memberships).values({
          id: ids.membership(),
          tenantId: invite.tenantId,
          userId: user.id,
          role: invite.role,
        });
        recordAudit({
          tenantId: invite.tenantId,
          actorUserId: user.id,
          actorEmail: user.email,
          action: "member.joined",
          target: user.id,
          metadata: { role: invite.role, inviteId: invite.id },
        });
      }
      await db()
        .update(invitations)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(invitations.id, invite.id));
      tenantId = invite.tenantId;
    }
  }

  // Signin path: pick the user's primary tenant.
  if (!tenantId) {
    const memberRows = await listUserTenants(user.id);
    tenantId = memberRows[0]?.tenant.id ?? null;
  }

  // No tenant at all (rare: orphan user). With self-serve signup removed,
  // these users have no path forward without admin intervention. Mark
  // verified and bounce them to login with an orphan flag.
  if (!tenantId) {
    await db().update(users).set({ emailVerified: true }).where(eq(users.id, user.id));
    return NextResponse.redirect(
      new URL("/command-centre/login?orphan=1", url.origin),
    );
  }

  await setSession({ userId: user.id, tenantId, email: user.email });

  // Fresh signups land in the onboarding wizard; signins go to wherever they
  // were heading (or the dashboard). The wizard self-skips if the tenant
  // already has its setup complete.
  let target: string;
  if (consumed.purpose === "signup") {
    target = "/command-centre/onboarding";
  } else if (consumed.redirect && consumed.redirect.startsWith("/")) {
    target = consumed.redirect;
  } else {
    target = "/command-centre";
  }
  return NextResponse.redirect(new URL(target, url.origin));
}
