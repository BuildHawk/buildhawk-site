import { NextResponse } from "next/server";
import {
  createPeaceOfMindCheckout,
  isStripeConfigured,
} from "@/lib/billing/peace-of-mind";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  const rl = rateLimit(clientIp(req), { bucket: "pom-checkout", max: 15 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  let body: { email?: string; name?: string; ref?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }

  // Scaffolded ahead of the Stripe account. Until keys are set in Vercel, tell
  // the form to fall back to "we'll email you a payment link".
  if (!isStripeConfigured()) {
    return NextResponse.json({ ok: false, code: "stripe_not_configured" }, { status: 503 });
  }

  try {
    const session = await createPeaceOfMindCheckout({
      email,
      name: body.name,
      ref: body.ref,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (e) {
    console.error("[pom-checkout] error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
