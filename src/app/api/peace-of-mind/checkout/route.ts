import { NextResponse } from "next/server";
import {
  createPeaceOfMindCheckoutSession,
  isPeaceOfMindPayFirstEnabled,
} from "@/lib/peace-of-mind/stripe";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/peace-of-mind/checkout
 *
 * Body (JSON): { name, email, phone, address, quoteCount, builders?, notes? }
 *
 * Returns: { ok: true, url } where url is the Stripe-hosted checkout URL.
 *
 * 404s if the pay-first flow isn't enabled (PEACE_OF_MIND_PRICE_ID unset or
 * Stripe keys missing), so the route doesn't accidentally serve an empty
 * session URL.
 */
export async function POST(req: Request) {
  const rl = rateLimit(clientIp(req), { bucket: "peace-of-mind-checkout", max: 10 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);

  if (!isPeaceOfMindPayFirstEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Pay-first checkout is not enabled." },
      { status: 404 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim();
  const quoteCount = String(body.quoteCount ?? "").trim();
  const builders = String(body.builders ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const honeypot = String(body.website ?? "").trim();

  if (honeypot) {
    // Silent ack; don't tell the bot what tripped it.
    return NextResponse.json({ ok: true, url: "https://www.buildhawk.com.au/peace-of-mind" });
  }

  if (!name) return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }
  if (!phone) return NextResponse.json({ ok: false, error: "Phone is required." }, { status: 400 });
  if (!address) return NextResponse.json({ ok: false, error: "Project address is required." }, { status: 400 });
  if (!["1", "2", "3"].includes(quoteCount)) {
    return NextResponse.json(
      { ok: false, error: "Select how many quotes (1, 2 or 3)." },
      { status: 400 },
    );
  }

  try {
    const session = await createPeaceOfMindCheckoutSession({
      form: { name, email, phone, address, quoteCount, builders, notes },
    });
    if (!session.url) {
      return NextResponse.json(
        { ok: false, error: "Checkout session did not return a URL." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[peace-of-mind/checkout] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Checkout failed.",
      },
      { status: 500 },
    );
  }
}
