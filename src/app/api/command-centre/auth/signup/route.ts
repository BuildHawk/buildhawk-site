import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  isAuthConfigured,
  isSigninAllowed,
  isSignupDisabled,
  issueMagicLink,
  normalizeEmail,
} from "@/lib/auth";
import { magicLinkUrl, renderMagicLinkEmail, sendAuthEmail } from "../_email";

import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ALLOWED_PLANS = ["starter", "pro", "enterprise"] as const;
type Plan = (typeof ALLOWED_PLANS)[number];

export async function POST(req: Request) {
  const _rl = rateLimit(clientIp(req), { bucket: "auth-signup", max: 8 });
  if (!_rl.ok) return tooManyRequests(_rl.retryAfter);

  if (!isAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Auth not configured." },
      { status: 503 },
    );
  }
  if (isSignupDisabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "BuildHawk is currently invitation-only. Use the Request Access form on the sign-in page and the team will reply within one business day.",
      },
      { status: 403 },
    );
  }
  let body: {
    email?: string;
    name?: string;
    tenantName?: string;
    plan?: string;
    redirect?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const tenantName = typeof body.tenantName === "string" ? body.tenantName.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const planRaw = typeof body.plan === "string" ? body.plan : "starter";
  const plan: Plan = (ALLOWED_PLANS as readonly string[]).includes(planRaw)
    ? (planRaw as Plan)
    : "starter";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400 });
  }
  if (!tenantName || tenantName.length < 2 || tenantName.length > 80) {
    return NextResponse.json(
      { ok: false, error: "Company name is required" },
      { status: 400 },
    );
  }
  if (!isSigninAllowed(email)) {
    // Don't tell the visitor they're not on the allowlist (low-key reveal of
    // the gate). Pretend success — the email simply never arrives.
    return NextResponse.json({ ok: true });
  }

  try {
    const rawToken = await issueMagicLink({
      email,
      purpose: "signup",
      redirect: body.redirect ?? "/command-centre",
      metadata: { name, tenantName, plan },
    });
    const link = magicLinkUrl(rawToken);
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { text, html } = renderMagicLinkEmail({ link, mode: "signup", tenantName });
    await sendAuthEmail(resend, {
      to: email,
      subject: "Confirm your BuildHawk account",
      html,
      text,
    });
  } catch (e) {
    console.error("[auth] signup error:", e);
    return NextResponse.json(
      { ok: false, error: "Could not send confirmation email" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
