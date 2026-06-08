/**
 * Peace of Mind — one-off ($499 + GST) checkout.
 *
 * Separate from the command-centre subscription billing in `stripe.ts`: this is
 * a single `mode: "payment"` charge with no tenant, no auth and no database.
 * It runs after the visitor has submitted the tick-and-flick form (lead + docs
 * already captured by /api/peace-of-mind/start), so an abandoned payment never
 * loses the lead.
 *
 * GST handling (set ONE of these in Vercel; otherwise the charge is ex-GST and
 * GST must be reconciled manually — flagged for go-live):
 *   - STRIPE_GST_TAX_RATE_ID   → a pre-created 10% GST TaxRate id (txr_...).
 *   - STRIPE_AUTOMATIC_TAX=true → use Stripe Tax (requires Tax to be enabled
 *     and an origin address configured in the Stripe dashboard).
 *
 * Price defaults to AUD 499 and can be overridden with POM_PRICE_AUD.
 */

import { stripe, isStripeConfigured, SITE_URL } from "./stripe";

export { isStripeConfigured };

const PRICE_AUD = Number(process.env.POM_PRICE_AUD || "499");

export type PeaceOfMindCheckoutInput = {
  email: string;
  name?: string;
  /** Internal reference (the start route's submissionId) for Stripe metadata. */
  ref?: string;
};

export async function createPeaceOfMindCheckout(input: PeaceOfMindCheckoutInput) {
  const taxRateId = process.env.STRIPE_GST_TAX_RATE_ID;
  const automaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: Math.round(PRICE_AUD * 100),
          product_data: {
            name: "Peace of Mind — independent quote review",
            description:
              "Independent third-party review of your builder quotes (up to 3).",
          },
        },
        ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
      },
    ],
    ...(automaticTax ? { automatic_tax: { enabled: true } } : {}),
    metadata: {
      product: "peace-of-mind",
      name: input.name ?? "",
      ref: input.ref ?? "",
    },
    success_url: `${SITE_URL}/peace-of-mind?paid=1`,
    cancel_url: `${SITE_URL}/peace-of-mind?cancelled=1#start`,
  });

  return session;
}
