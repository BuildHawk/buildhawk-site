import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Always run fresh; never cache health checks.
export const dynamic = "force-dynamic";

/**
 * Lightweight uptime endpoint for external monitoring (Better Uptime, Pingdom,
 * UptimeRobot). Reports green/yellow based on whether critical env vars are
 * configured. Never reveals secret values or per-tenant data.
 */
export async function GET() {
  // Core SaaS dependencies (required for signup/signin/per-tenant data).
  const saas = {
    authSecret: Boolean(process.env.BH_AUTH_SECRET),
    database: Boolean(process.env.DATABASE_URL),
    encryptionKey: Boolean(process.env.BH_ENCRYPTION_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
  };
  // Optional integrations (founding subscriber path + AI).
  const optional = {
    ghlLeadCapture: Boolean(process.env.GHL_API_KEY),
    ghlHomesByNh: Boolean(process.env.GHL_HBNH_API_KEY),
    workbookField: Boolean(process.env.GHL_HBNH_PROJECT_DATA_FIELD_ID),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
  };
  // Peace of Mind quote-review form (public /peace-of-mind page).
  // blob is the only hard dependency. resend + ghl are nice-to-have so ops
  // gets notified and CRM gets written. stripePrice activates the pay-first
  // checkout flow when set; without it the form falls back to no-payment mode.
  const peaceOfMind = {
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    resend: Boolean(process.env.RESEND_API_KEY),
    ghl: Boolean(process.env.GHL_API_KEY),
    stripePrice: Boolean(process.env.PEACE_OF_MIND_PRICE_ID),
  };
  const saasReady = Object.values(saas).every(Boolean);
  const peaceOfMindReady = peaceOfMind.blob;
  const allGreen =
    saasReady &&
    peaceOfMindReady &&
    Object.values(optional).every(Boolean) &&
    Object.values(peaceOfMind).every(Boolean);
  return NextResponse.json(
    {
      ok: true,
      status: allGreen
        ? "green"
        : saasReady && peaceOfMindReady
          ? "yellow"
          : "red",
      timestamp: new Date().toISOString(),
      saas,
      optional,
      peaceOfMind,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
