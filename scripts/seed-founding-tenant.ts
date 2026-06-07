/**
 * One-shot seed for the Homes by NH founding tenant.
 *
 * Idempotent: re-running won't duplicate rows.
 *
 * Reads from the legacy env vars to migrate state into the SaaS DB:
 *   BH_AUTHORIZED_EMAILS         comma-separated founding-cohort allowlist
 *   GHL_HBNH_API_KEY             legacy GHL Private Integration Token
 *   GHL_HBNH_LOCATION_ID         legacy GHL location id
 *   GHL_HBNH_PROJECT_DATA_FIELD_ID  legacy overlay custom-field id
 *   DATABASE_URL                 Neon connection string
 *   BH_ENCRYPTION_KEY            base64 32-byte AES key
 *
 * Run with: npx tsx scripts/seed-founding-tenant.ts
 */

import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import {
  integrations,
  memberships,
  tenants,
  users,
} from "../src/lib/db/schema";
import { ids } from "../src/lib/db/ids";
import { encryptJson } from "../src/lib/crypto";

const TENANT_NAME = "Homes by NH";
const TENANT_SLUG = "homes-by-nh-founding";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  if (!process.env.BH_ENCRYPTION_KEY) throw new Error("BH_ENCRYPTION_KEY not set");

  const founderEmails = (process.env.BH_AUTHORIZED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (founderEmails.length === 0) {
    throw new Error("BH_AUTHORIZED_EMAILS is empty; nothing to backfill");
  }

  // 1. Tenant: insert or fetch by slug.
  let tenant = (
    await db().select().from(tenants).where(eq(tenants.slug, TENANT_SLUG)).limit(1)
  )[0];
  if (!tenant) {
    const tenantId = ids.tenant();
    [tenant] = await db()
      .insert(tenants)
      .values({
        id: tenantId,
        slug: TENANT_SLUG,
        name: TENANT_NAME,
        plan: "pro",
        status: "active",
        primaryRegion: "Geelong VIC",
        settings: { targetMarginPct: 17, varianceThresholdPct: 5 },
      })
      .returning();
    console.log(`Created tenant: ${tenant.id} (${TENANT_NAME})`);
  } else {
    console.log(`Tenant already exists: ${tenant.id} (${TENANT_NAME})`);
  }

  // 2. Founding users + memberships (owner role on the Homes by NH tenant).
  for (const email of founderEmails) {
    let user = (
      await db().select().from(users).where(eq(users.email, email)).limit(1)
    )[0];
    if (!user) {
      const userId = ids.user();
      [user] = await db()
        .insert(users)
        .values({ id: userId, email, emailVerified: true })
        .returning();
      console.log(`Created user: ${user.id} (${email})`);
    } else {
      console.log(`User already exists: ${user.id} (${email})`);
    }

    const existingMembership = (
      await db()
        .select()
        .from(memberships)
        .where(and(eq(memberships.tenantId, tenant.id), eq(memberships.userId, user.id)))
        .limit(1)
    )[0];
    if (!existingMembership) {
      await db().insert(memberships).values({
        id: ids.membership(),
        tenantId: tenant.id,
        userId: user.id,
        role: "owner",
      });
      console.log(`  → granted owner role on ${TENANT_NAME}`);
    }
  }

  // 3. GHL integration: encrypt the legacy credentials and attach to this tenant.
  const apiKey = process.env.GHL_HBNH_API_KEY;
  const locationId = process.env.GHL_HBNH_LOCATION_ID || "faIZiavkSvyDcMVx7Dmf";
  const projectDataFieldId = process.env.GHL_HBNH_PROJECT_DATA_FIELD_ID;
  if (apiKey) {
    const existingIntegration = (
      await db()
        .select()
        .from(integrations)
        .where(and(eq(integrations.tenantId, tenant.id), eq(integrations.kind, "ghl")))
        .limit(1)
    )[0];
    const enc = encryptJson({ apiKey, locationId, projectDataFieldId });
    if (existingIntegration) {
      await db()
        .update(integrations)
        .set({
          encryptedConfig: enc.ciphertext,
          configIv: enc.iv,
          configTag: enc.tag,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, existingIntegration.id));
      console.log(`Updated GHL integration on ${TENANT_NAME}`);
    } else {
      await db().insert(integrations).values({
        id: ids.integration(),
        tenantId: tenant.id,
        kind: "ghl",
        encryptedConfig: enc.ciphertext,
        configIv: enc.iv,
        configTag: enc.tag,
        isActive: true,
      });
      console.log(`Created GHL integration on ${TENANT_NAME}`);
    }
  } else {
    console.warn("No GHL_HBNH_API_KEY in env; skipping integration seed.");
  }

  console.log("Seed complete.");
  // Drizzle Neon HTTP doesn't open a long-lived connection, but exit explicitly
  // so the script terminates promptly.
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
