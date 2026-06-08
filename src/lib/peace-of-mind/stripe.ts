/**
 * Stripe wiring for the Peace of Mind quote-review purchase.
 *
 * Feature-flagged by PEACE_OF_MIND_PRICE_ID. When that env var is set the
 * /peace-of-mind page renders the pay-first flow and /api/peace-of-mind/start
 * requires a verified-paid Stripe session before accepting files. When unset
 * the original files-first flow runs (ops follows up for payment manually).
 *
 * Reuses src/lib/billing/stripe.ts for the lazy client init so the build
 * doesn't require STRIPE_SECRET_KEY at compile time.
 */

import { stripe, isStripeConfigured } from "@/lib/billing/stripe";

export type PeaceOfMindStripeConfig = {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://www.buildhawk.com.au");

export function isPeaceOfMindPayFirstEnabled(): boolean {
  return Boolean(process.env.PEACE_OF_MIND_PRICE_ID) && isStripeConfigured();
}

export type PeaceOfMindFormSnapshot = {
  name: string;
  email: string;
  phone: string;
  address: string;
  quoteCount: string;
  builders: string;
  notes: string;
};

/**
 * Create a Checkout Session for the $499 + GST quote review. Form details are
 * stashed in session metadata so the upload step after payment can pre-fill
 * the rest without asking again.
 */
export async function createPeaceOfMindCheckoutSession(args: {
  form: PeaceOfMindFormSnapshot;
}) {
  const priceId = process.env.PEACE_OF_MIND_PRICE_ID;
  if (!priceId) {
    throw new Error("PEACE_OF_MIND_PRICE_ID is not set");
  }
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: args.form.email,
    success_url: `${SITE_URL}/peace-of-mind/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/peace-of-mind#start`,
    // Metadata caps at 500 chars per value, 50 keys. Notes is the longest field;
    // truncate defensively. The customer can re-enter on the success page if
    // we ever need full fidelity.
    metadata: {
      pom_name: args.form.name.slice(0, 500),
      pom_phone: args.form.phone.slice(0, 500),
      pom_address: args.form.address.slice(0, 500),
      pom_quoteCount: args.form.quoteCount,
      pom_builders: args.form.builders.slice(0, 500),
      pom_notes: args.form.notes.slice(0, 500),
    },
    payment_intent_data: {
      description: `BuildHawk Peace of Mind quote review (${args.form.quoteCount} quote${args.form.quoteCount === "1" ? "" : "s"})`,
    },
    // Surface a tax-invoice email automatically. The customer's country/GST
    // handling is set in Stripe Dashboard, not here.
    invoice_creation: { enabled: true },
  });
  return session;
}

export type VerifiedPaidSession = {
  sessionId: string;
  paymentStatus: "paid" | "no_payment_required" | "unpaid";
  customerEmail: string | null;
  amountTotal: number | null;
  currency: string | null;
  form: PeaceOfMindFormSnapshot;
};

/**
 * Look up a Checkout Session and confirm it's been paid. Called by the
 * success page (to gate the upload UI) and by /api/peace-of-mind/start
 * (to gate file uploads against forged session_ids).
 */
export async function verifyPaidSession(sessionId: string): Promise<VerifiedPaidSession | null> {
  if (!sessionId) return null;
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const meta = session.metadata || {};
    return {
      sessionId: session.id,
      paymentStatus: (session.payment_status ?? "unpaid") as VerifiedPaidSession["paymentStatus"],
      customerEmail:
        session.customer_details?.email ?? session.customer_email ?? null,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      form: {
        name: meta.pom_name ?? "",
        email: session.customer_details?.email ?? session.customer_email ?? "",
        phone: meta.pom_phone ?? "",
        address: meta.pom_address ?? "",
        quoteCount: meta.pom_quoteCount ?? "1",
        builders: meta.pom_builders ?? "",
        notes: meta.pom_notes ?? "",
      },
    };
  } catch (err) {
    console.warn("[peace-of-mind/stripe] verifyPaidSession failed:", err);
    return null;
  }
}
