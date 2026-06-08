/**
 * Stripe client + helpers. Lazy init so build doesn't require STRIPE_SECRET_KEY.
 */

import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tenants } from "@/lib/db/schema";
import { PLANS, type PlanTier } from "./plans";

let _stripe: Stripe | null = null;

export const isStripeConfigured = () =>
  Boolean(process.env.STRIPE_SECRET_KEY) &&
  Boolean(process.env.STRIPE_WEBHOOK_SECRET);

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY not set. Add it to Vercel env to enable billing.",
    );
  }
  if (_stripe) return _stripe;
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return _stripe;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://www.buildhawk.com.au");

export async function ensureStripeCustomer(tenantId: string, email: string, name?: string) {
  const tenant = (
    await db().select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  )[0];
  if (!tenant) throw new Error("Tenant not found");
  if (tenant.stripeCustomerId) return tenant.stripeCustomerId;
  const customer = await stripe().customers.create({
    email,
    name: name ?? tenant.name,
    metadata: { tenantId },
  });
  await db()
    .update(tenants)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));
  return customer.id;
}

export async function createCheckoutSession(opts: {
  tenantId: string;
  email: string;
  name?: string;
  tier: PlanTier;
}) {
  const priceId = process.env[PLANS[opts.tier].stripePriceIdEnv];
  if (!priceId) {
    throw new Error(
      `Stripe price not configured for ${opts.tier}. Set ${PLANS[opts.tier].stripePriceIdEnv}.`,
    );
  }
  const customerId = await ensureStripeCustomer(opts.tenantId, opts.email, opts.name);
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
      metadata: { tenantId: opts.tenantId, tier: opts.tier },
    },
    metadata: { tenantId: opts.tenantId, tier: opts.tier },
    success_url: `${SITE_URL}/command-centre/settings/billing?status=success`,
    cancel_url: `${SITE_URL}/command-centre/settings/billing?status=cancelled`,
  });
  return session;
}

export async function createPortalSession(tenantId: string) {
  const tenant = (
    await db().select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  )[0];
  if (!tenant?.stripeCustomerId) {
    throw new Error("No Stripe customer for this tenant yet");
  }
  return stripe().billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${SITE_URL}/command-centre/settings/billing`,
  });
}
