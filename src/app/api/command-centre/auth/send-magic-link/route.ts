import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import {
  isAuthConfigured,
  isSigninAllowed,
  issueMagicLink,
  normalizeEmail,
} from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { renderMagicLinkEmail, magicLinkUrl, sendAuthEmail } from "../_email";

import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const _rl = rateLimit(clientIp(req), { bucket: "auth-magic-link", max: 8 });
  if (!_rl.ok) return tooManyRequests(_rl.retryAfter);

  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Auth not configured. Set BH_AUTH_SECRET, DATABASE_URL, BH_ENCRYPTION_KEY and RESEND_API_KEY.",
      },
      { status: 503 },
    );
  }
  let body: { email?: string; redirect?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400 });
  }

  // Always respond OK to avoid leaking whether an account exists or whether the
  // allowlist would have permitted them. Only send if user exists AND is allowlisted.
  try {
    if (!isSigninAllowed(email)) {
      return NextResponse.json({ ok: true });
    }
    const existing = (
      await db().select().from(users).where(eq(users.email, email)).limit(1)
    )[0];
    if (existing) {
      const rawToken = await issueMagicLink({
        email,
        purpose: "signin",
        redirect: body.redirect,
      });
      const link = magicLinkUrl(rawToken);
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const { text, html } = renderMagicLinkEmail({ link, mode: "signin" });
      await sendAuthEmail(resend, {
        to: email,
        subject: "Your BuildHawk Cost Plan Console sign-in link",
        html,
        text,
      });
    }
  } catch (e) {
    console.error("[auth] send-magic-link error:", e);
  }

  return NextResponse.json({ ok: true });
}
