/**
 * BuildHawk SaaS data model.
 *
 * Tenant-first: every row outside the tenants table is scoped to a tenant_id.
 * IDs are short-prefixed nanoids so they're greppable in logs (ten_, usr_, etc).
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const tenantStatusEnum = pgEnum("tenant_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "paused",
]);

export const planTierEnum = pgEnum("plan_tier", [
  "starter",
  "pro",
  "enterprise",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "director",
  "estimator",
  "viewer",
]);

// integration.kind is a free-form connector id (e.g. "ghl", "procore",
// "buildxact", "monday", "webhook"). Stored as text so adding a new connector
// is a TypeScript-only change. The canonical catalog lives in
// src/lib/integrations/connectors.ts.

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

/* ------------------------------------------------------------------ */
/* Tenants                                                            */
/* ------------------------------------------------------------------ */

export const tenants = pgTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    primaryRegion: text("primary_region"),
    abn: text("abn"),
    status: tenantStatusEnum("status").notNull().default("trialing"),
    plan: planTierEnum("plan").notNull().default("starter"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    branding: jsonb("branding").$type<{
      accent?: string;
      logoUrl?: string;
      tagline?: string;
    }>(),
    settings: jsonb("settings").$type<{
      targetMarginPct?: number;
      varianceThresholdPct?: number;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    slugIdx: uniqueIndex("tenants_slug_idx").on(t.slug),
    stripeCustomerIdx: uniqueIndex("tenants_stripe_customer_idx").on(
      t.stripeCustomerId,
    ),
  }),
);

/* ------------------------------------------------------------------ */
/* Users (global, can belong to multiple tenants)                     */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    // Password auth, optional. NULL means the user has only used magic links.
    // Format: "<scrypt-derived-key-hex>:<salt-hex>:<N>:<r>:<p>"
    passwordHash: text("password_hash"),
    passwordSetAt: timestamp("password_set_at", { withTimezone: true }),
    lastSignedInAt: timestamp("last_signed_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

/* ------------------------------------------------------------------ */
/* Memberships (user × tenant × role)                                 */
/* ------------------------------------------------------------------ */

export const memberships = pgTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("director"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqueMembership: uniqueIndex("memberships_tenant_user_idx").on(
      t.tenantId,
      t.userId,
    ),
    userIdx: index("memberships_user_idx").on(t.userId),
  }),
);

/* ------------------------------------------------------------------ */
/* Invitations                                                        */
/* ------------------------------------------------------------------ */

export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: memberRoleEnum("role").notNull().default("director"),
    invitedByUserId: text("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: inviteStatusEnum("status").notNull().default("pending"),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantEmailIdx: index("invitations_tenant_email_idx").on(t.tenantId, t.email),
    tokenIdx: uniqueIndex("invitations_token_idx").on(t.tokenHash),
  }),
);

/* ------------------------------------------------------------------ */
/* Integrations (encrypted credentials per tenant)                    */
/* ------------------------------------------------------------------ */

export const integrations = pgTable(
  "integrations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    label: text("label"),
    // Encrypted JSON blob (AES-256-GCM). Shape varies by kind:
    //   ghl: { apiKey, locationId, projectDataFieldId? }
    //   xero: { tenantId, refreshToken }
    //   buildxact: { apiKey, companyId }
    encryptedConfig: text("encrypted_config").notNull(),
    configIv: text("config_iv").notNull(),
    configTag: text("config_tag").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    lastSyncStatus: text("last_sync_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantKindIdx: uniqueIndex("integrations_tenant_kind_idx").on(t.tenantId, t.kind),
  }),
);

/* ------------------------------------------------------------------ */
/* Audit log                                                          */
/* ------------------------------------------------------------------ */

export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    target: text("target"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantCreatedIdx: index("audit_tenant_created_idx").on(t.tenantId, t.createdAt),
  }),
);

/* ------------------------------------------------------------------ */
/* Magic-link tokens (replaces previous in-memory / cookie-only flow) */
/* ------------------------------------------------------------------ */

export const magicLinks = pgTable(
  "magic_links",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    email: text("email").notNull(),
    purpose: text("purpose").notNull().default("signin"),
    redirect: text("redirect"),
    metadata: jsonb("metadata"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tokenIdx: uniqueIndex("magic_links_token_idx").on(t.tokenHash),
    emailIdx: index("magic_links_email_idx").on(t.email),
  }),
);

/* ------------------------------------------------------------------ */
/* Usage counters (for plan limits)                                   */
/* ------------------------------------------------------------------ */

export const usageCounters = pgTable(
  "usage_counters",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => ({
    tenantMetricPeriod: uniqueIndex("usage_tenant_metric_period_idx").on(
      t.tenantId,
      t.metric,
      t.periodStart,
    ),
  }),
);

/* ------------------------------------------------------------------ */
/* Hawktress benchmark samples                                        */
/* ------------------------------------------------------------------ */

/**
 * One row per awarded subcontract written by any tenant. Powers the
 * cross-tenant Hawktress benchmark cohort. Tenant ID is stored so we can
 * dedupe re-saves of the same overlay; it is never returned by the public
 * benchmark API.
 */
export const benchmarkSamples = pgTable(
  "benchmark_samples",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sourceOpportunityId: text("source_opportunity_id").notNull(),
    sourceAwardId: text("source_award_id").notNull(),
    region: text("region").notNull(),
    tradeSection: text("trade_section").notNull(),
    projectType: text("project_type"),
    awardedValue: numeric("awarded_value", { precision: 14, scale: 2 }).notNull(),
    awardDate: date("award_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    dimensionIdx: index("benchmark_samples_dim_idx").on(
      t.region,
      t.tradeSection,
      t.projectType,
    ),
    dedupIdx: uniqueIndex("benchmark_samples_dedup_idx").on(
      t.sourceOpportunityId,
      t.sourceAwardId,
    ),
  }),
);

/* ------------------------------------------------------------------ */
/* CMS articles                                                       */
/* ------------------------------------------------------------------ */

export const cmsArticles = pgTable(
  "cms_articles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    dek: text("dek").notNull(),
    authorId: text("author_id").notNull().default("nathan"),
    date: text("date").notNull(),
    readingTime: integer("reading_time").notNull().default(5),
    category: text("category").notNull().default("Field Notes"),
    cover: text("cover").notNull(),
    body: text("body").notNull(),
    youtubeId: text("youtube_id"),
    videoLabel: text("video_label"),
    videoSrc: text("video_src"),
    videoPoster: text("video_poster"),
    videoCredit: text("video_credit"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    slugIdx: uniqueIndex("cms_articles_slug_idx").on(t.slug),
  }),
);

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type MagicLink = typeof magicLinks.$inferSelect;
export type UsageCounter = typeof usageCounters.$inferSelect;
export type BenchmarkSample = typeof benchmarkSamples.$inferSelect;
export type CmsArticle = typeof cmsArticles.$inferSelect;
