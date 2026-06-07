#!/usr/bin/env node
/**
 * Extended pressure test — security, authorization, integration roundtrips.
 *
 * Run AFTER scripts/pressure-test.mjs passes. This one digs deeper:
 *   • Magic-link single-use + expiry enforcement
 *   • Session cookie tampering / malformed cookie rejection
 *   • Role-based authorization (viewer can't access admin endpoints)
 *   • GHL integration save → get → disconnect roundtrip
 *   • Cross-tenant write protection (Tenant A's session can't touch Tenant B)
 *   • Cache header sanity on whoami
 *   • Settings page HTML contains expected sections
 *   • Tenant in 'paused' status sees BillingRequired
 */
import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "node:crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const BASE = process.env.BASE_URL || "https://www.buildhawk.com.au";
const sql = neon(process.env.DATABASE_URL);
const rid = (prefix) => `${prefix}_${randomBytes(8).toString("hex")}`;

let pass = 0,
  fail = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ✗ ${name}\n    ${e.message}`);
  }
}
const section = (t) => console.log(`\n━━━ ${t} ━━━`);
const fetchSite = (path, init = {}) => fetch(BASE + path, init);

async function mintSession(email) {
  // Caller has already INSERTed the user + membership in tenantHint.
  // Mint a signin magic link, consume it, return the session cookie.
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await sql.query(
    `INSERT INTO magic_links (id, token_hash, email, purpose, redirect, expires_at)
     VALUES ($1, $2, $3, 'signin', '/command-centre', now() + interval '30 minutes')`,
    [rid("mlk"), tokenHash, email],
  );
  const v = await fetchSite(
    `/api/command-centre/auth/verify?token=${encodeURIComponent(rawToken)}`,
    { redirect: "manual" },
  );
  if (v.status !== 307 && v.status !== 302)
    throw new Error(`verify failed: ${v.status}`);
  const setCookie = v.headers.get("set-cookie") ?? "";
  const m = setCookie.match(/bh_session=([^;]+)/);
  if (!m) throw new Error("no session cookie");
  return `bh_session=${m[1]}`;
}

// ─── seed two ephemeral tenants + users (cleaned up at end) ─────────────────
section("Setup: two ephemeral tenants for security/auth tests");

const tenA = rid("ten");
const tenB = rid("ten");
const userOwnerA = rid("usr");
const userViewerA = rid("usr");
const userOwnerB = rid("usr");
const emailOwnerA = `owner-a+${Date.now()}@test.local`;
const emailViewerA = `viewer-a+${Date.now()}@test.local`;
const emailOwnerB = `owner-b+${Date.now()}@test.local`;
const pausedTenant = rid("ten");
const pausedUser = rid("usr");
const pausedEmail = `paused+${Date.now()}@test.local`;

await check("seed Tenant A + owner + viewer, Tenant B + owner, paused tenant", async () => {
  await sql.query(
    `INSERT INTO tenants (id, slug, name, plan, status, trial_ends_at) VALUES
       ($1, $2, 'Tenant A', 'starter', 'trialing', now() + interval '14 days'),
       ($3, $4, 'Tenant B', 'starter', 'trialing', now() + interval '14 days'),
       ($5, $6, 'Paused Tenant', 'starter', 'paused', null)`,
    [tenA, `a-${Date.now().toString(36)}`, tenB, `b-${Date.now().toString(36)}`, pausedTenant, `p-${Date.now().toString(36)}`],
  );
  await sql.query(
    `INSERT INTO users (id, email, email_verified) VALUES ($1,$2,true), ($3,$4,true), ($5,$6,true), ($7,$8,true)`,
    [userOwnerA, emailOwnerA, userViewerA, emailViewerA, userOwnerB, emailOwnerB, pausedUser, pausedEmail],
  );
  await sql.query(
    `INSERT INTO memberships (id, tenant_id, user_id, role) VALUES
       ($1, $2, $3, 'owner'),
       ($4, $5, $6, 'viewer'),
       ($7, $8, $9, 'owner'),
       ($10, $11, $12, 'owner')`,
    [
      rid("mem"), tenA, userOwnerA,
      rid("mem"), tenA, userViewerA,
      rid("mem"), tenB, userOwnerB,
      rid("mem"), pausedTenant, pausedUser,
    ],
  );
});

const cookieOwnerA = await mintSession(emailOwnerA, tenA);
const cookieViewerA = await mintSession(emailViewerA, tenA);
const cookieOwnerB = await mintSession(emailOwnerB, tenB);
const cookiePaused = await mintSession(pausedEmail, pausedTenant);

// ─── Magic link single-use + expiry ─────────────────────────────────────────
section("Magic link enforcement");

await check("magic link cannot be replayed (single-use)", async () => {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await sql.query(
    `INSERT INTO magic_links (id, token_hash, email, purpose, redirect, expires_at)
     VALUES ($1, $2, $3, 'signin', '/command-centre', now() + interval '30 minutes')`,
    [rid("mlk"), tokenHash, emailOwnerA],
  );
  // First consume — should succeed
  const first = await fetchSite(
    `/api/command-centre/auth/verify?token=${encodeURIComponent(rawToken)}`,
    { redirect: "manual" },
  );
  if (first.status !== 307 && first.status !== 302)
    throw new Error(`first consume failed: ${first.status}`);
  // Second consume — must fail
  const second = await fetchSite(
    `/api/command-centre/auth/verify?token=${encodeURIComponent(rawToken)}`,
    { redirect: "manual" },
  );
  const loc = second.headers.get("location") ?? "";
  if (!loc.includes("error=expired") && second.status === 307)
    throw new Error(`replay should redirect with error=expired, got ${loc}`);
  if (second.status === 307 && loc.includes("error=expired")) {
    // perfect — second time rejected
    return;
  }
  // Some other rejection is also acceptable as long as it's not a normal success
  if (second.status === 307) throw new Error(`replay accepted: ${loc}`);
});

await check("expired magic link rejected", async () => {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  // Pre-expired (1 hour ago)
  await sql.query(
    `INSERT INTO magic_links (id, token_hash, email, purpose, redirect, expires_at)
     VALUES ($1, $2, $3, 'signin', '/command-centre', now() - interval '1 hour')`,
    [rid("mlk"), tokenHash, emailOwnerA],
  );
  const res = await fetchSite(
    `/api/command-centre/auth/verify?token=${encodeURIComponent(rawToken)}`,
    { redirect: "manual" },
  );
  const loc = res.headers.get("location") ?? "";
  if (!loc.includes("error=expired"))
    throw new Error(`expired token not rejected: ${loc}`);
});

await check("nonsense magic link rejected", async () => {
  const res = await fetchSite(
    `/api/command-centre/auth/verify?token=not-a-real-token`,
    { redirect: "manual" },
  );
  const loc = res.headers.get("location") ?? "";
  if (!loc.includes("error=expired"))
    throw new Error(`nonsense token not rejected: ${loc}`);
});

// ─── Session cookie tampering ───────────────────────────────────────────────
section("Session cookie security");

await check("missing cookie → 401 / redirect", async () => {
  const res = await fetchSite("/api/command-centre/audit");
  if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
});

await check("malformed cookie → 401 / redirect", async () => {
  const res = await fetchSite("/api/command-centre/audit", {
    headers: { Cookie: "bh_session=this.is.not.valid" },
  });
  if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
});

await check("tampered HMAC signature rejected", async () => {
  // Take a real cookie, mutate the signature half.
  const real = cookieOwnerA.replace(/^bh_session=/, "");
  const [body, sig] = real.split(".");
  const tampered = `${body}.${sig.slice(0, -4)}AAAA`;
  const res = await fetchSite("/api/command-centre/audit", {
    headers: { Cookie: `bh_session=${tampered}` },
  });
  if (res.status !== 401)
    throw new Error(`tampered HMAC accepted (status ${res.status})`);
});

await check("body tampering with valid-looking but unsigned token rejected", async () => {
  // Construct a fake body + arbitrary sig (no HMAC secret available locally).
  const fakeBody = Buffer.from(
    JSON.stringify({ userId: userOwnerB, tenantId: tenA, email: emailOwnerB, exp: 9999999999 }),
  )
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const fakeSig = "x".repeat(43); // looks like an HMAC b64url length
  const res = await fetchSite("/api/command-centre/audit", {
    headers: { Cookie: `bh_session=${fakeBody}.${fakeSig}` },
  });
  if (res.status !== 401)
    throw new Error(`unsigned forged token accepted (status ${res.status})`);
});

// ─── Role-based authorization (viewer rejected from admin endpoints) ────────
section("Role-based authorization");

await check("viewer GETs audit → 403", async () => {
  const res = await fetchSite("/api/command-centre/audit", {
    headers: { Cookie: cookieViewerA },
  });
  if (res.status !== 403) throw new Error(`viewer audit should be 403, got ${res.status}`);
});

await check("viewer POSTs integrations/ghl → 403", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    method: "POST",
    headers: { Cookie: cookieViewerA, "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: "pit-fake", locationId: "fake-loc" }),
  });
  if (res.status !== 403) throw new Error(`viewer POST ghl should be 403, got ${res.status}`);
});

await check("viewer DELETEs integrations/ghl → 403", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    method: "DELETE",
    headers: { Cookie: cookieViewerA },
  });
  if (res.status !== 403)
    throw new Error(`viewer DELETE ghl should be 403, got ${res.status}`);
});

await check("viewer can GET own members list (200)", async () => {
  const res = await fetchSite("/api/command-centre/members", {
    headers: { Cookie: cookieViewerA },
  });
  if (res.status !== 200) throw new Error(`viewer members should be 200, got ${res.status}`);
});

await check("viewer POSTs member invite → 403", async () => {
  const res = await fetchSite("/api/command-centre/members/invite", {
    method: "POST",
    headers: { Cookie: cookieViewerA, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "x@test.local", role: "viewer" }),
  });
  if (res.status !== 403)
    throw new Error(`viewer invite should be 403, got ${res.status}`);
});

// ─── GHL integration roundtrip (save → get → disconnect) ────────────────────
section("GHL integration save → get → disconnect roundtrip");

await check("Tenant A owner saves a GHL config", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    method: "POST",
    headers: { Cookie: cookieOwnerA, "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: "pit-test-fake-key-aaaa-bbbb-cccc-dddd-eeee",
      locationId: "TEST_LOC_AAAA",
      projectDataFieldId: "TEST_FIELD_AAAA",
    }),
  });
  if (res.status !== 200) throw new Error(`save failed: ${res.status}`);
  const j = await res.json();
  if (!j.ok) throw new Error("save not ok");
});

await check("Tenant A owner GETs back the config (locationId visible, apiKey masked)", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    headers: { Cookie: cookieOwnerA },
  });
  if (res.status !== 200) throw new Error(`get failed: ${res.status}`);
  const j = await res.json();
  if (!j.config) throw new Error("no config returned");
  if (j.config.locationId !== "TEST_LOC_AAAA")
    throw new Error(`locationId roundtrip failed: ${j.config.locationId}`);
  if (j.config.projectDataFieldId !== "TEST_FIELD_AAAA")
    throw new Error("field roundtrip failed");
  if (j.config.hasApiKey !== true)
    throw new Error("hasApiKey should be true");
  if ("apiKey" in j.config)
    throw new Error("apiKey LEAKED in response (should be masked)");
});

await check("integration row was encrypted (no plaintext apiKey in DB)", async () => {
  const rows = await sql.query(
    `SELECT encrypted_config FROM integrations WHERE tenant_id = $1`,
    [tenA],
  );
  if (rows.length !== 1) throw new Error(`expected 1 row, got ${rows.length}`);
  const blob = rows[0].encrypted_config;
  if (blob.includes("pit-test-fake-key"))
    throw new Error("apiKey stored in PLAINTEXT in DB — encryption broken");
});

await check("audit event 'integration.ghl.connected' recorded", async () => {
  await new Promise((r) => setTimeout(r, 750));
  const rows = await sql.query(
    `SELECT action FROM audit_events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [tenA],
  );
  if (!rows.some((r) => r.action === "integration.ghl.connected"))
    throw new Error(`no connect audit; got: ${rows.map((r) => r.action).join(",")}`);
});

await check("Tenant A owner DELETEs the integration", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    method: "DELETE",
    headers: { Cookie: cookieOwnerA },
  });
  if (res.status !== 200) throw new Error(`delete failed: ${res.status}`);
});

await check("after disconnect, integrations/ghl GET returns config:null", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    headers: { Cookie: cookieOwnerA },
  });
  const j = await res.json();
  if (j.config !== null)
    throw new Error(`config not null after disconnect: ${JSON.stringify(j.config)}`);
});

await check("audit event 'integration.ghl.disconnected' recorded", async () => {
  await new Promise((r) => setTimeout(r, 750));
  const rows = await sql.query(
    `SELECT action FROM audit_events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [tenA],
  );
  if (!rows.some((r) => r.action === "integration.ghl.disconnected"))
    throw new Error("no disconnect audit event");
});

// ─── Cross-tenant write protection ──────────────────────────────────────────
section("Cross-tenant write protection");

await check("Tenant B owner cannot read Tenant A's audit log (sees their own)", async () => {
  const res = await fetchSite("/api/command-centre/audit", {
    headers: { Cookie: cookieOwnerB },
  });
  if (res.status !== 200) throw new Error(`tenant B audit not 200: ${res.status}`);
  const j = await res.json();
  // Tenant B should have its OWN audit log only — verify no Tenant A events bleed in
  // (Tenant B's events would be 0 at this point since we haven't done anything as B)
  // We can't directly assert "no Tenant A events" without knowing IDs, but we can
  // assert Tenant B's audit count matches their tenant_id only.
  const dbCount = await sql.query(
    `SELECT count(*)::int as c FROM audit_events WHERE tenant_id = $1`,
    [tenB],
  );
  if (j.events.length !== dbCount[0].c)
    throw new Error(`audit count mismatch: api=${j.events.length} db=${dbCount[0].c}`);
});

await check("Tenant B owner cannot read Tenant A's members", async () => {
  const res = await fetchSite("/api/command-centre/members", {
    headers: { Cookie: cookieOwnerB },
  });
  const j = await res.json();
  const tenantAEmails = [emailOwnerA, emailViewerA];
  const leaked = j.members.filter((m) => tenantAEmails.includes(m.email));
  if (leaked.length > 0)
    throw new Error(`Tenant B saw Tenant A members: ${leaked.map((m) => m.email).join(",")}`);
});

// ─── Whoami cache headers ───────────────────────────────────────────────────
section("Cache header sanity");

await check("whoami sets Cache-Control: no-store / private", async () => {
  const res = await fetchSite("/api/command-centre/auth/whoami", {
    headers: { Cookie: cookieOwnerA },
  });
  const cc = res.headers.get("cache-control") ?? "";
  if (!cc.includes("no-store") && !cc.includes("no-cache"))
    throw new Error(`whoami cache-control unsafe: ${cc}`);
});

await check("/api/health sets Cache-Control: no-store", async () => {
  const res = await fetchSite("/api/health");
  const cc = res.headers.get("cache-control") ?? "";
  if (!cc.includes("no-store"))
    throw new Error(`health cache-control should be no-store: ${cc}`);
});

// ─── Settings page HTML sections ────────────────────────────────────────────
section("Settings page UI sections present");

await check("/command-centre/settings renders Plan + Integrations + Team", async () => {
  const res = await fetchSite("/command-centre/settings", {
    headers: { Cookie: cookieOwnerA },
    redirect: "manual",
  });
  if (res.status !== 200) throw new Error(`settings status ${res.status}`);
  const html = await res.text();
  const required = ["Plan", "Integrations", "Team"];
  const missing = required.filter((s) => !html.includes(s));
  if (missing.length > 0)
    throw new Error(`missing settings sections: ${missing.join(", ")}`);
});

await check("/command-centre/settings shows Activity log for owner", async () => {
  const res = await fetchSite("/command-centre/settings", {
    headers: { Cookie: cookieOwnerA },
    redirect: "manual",
  });
  const html = await res.text();
  if (!html.includes("Activity log"))
    throw new Error("Activity log section not rendered for owner");
});

await check("/command-centre/settings HIDES Activity log for viewer", async () => {
  const res = await fetchSite("/command-centre/settings", {
    headers: { Cookie: cookieViewerA },
    redirect: "manual",
  });
  const html = await res.text();
  if (html.includes("Activity log"))
    throw new Error("Activity log section LEAKED to viewer role");
});

// ─── Paused tenant access ──────────────────────────────────────────────────
section("Paused tenant access");

await check("paused tenant dashboard shows BillingRequired", async () => {
  const res = await fetchSite("/command-centre", {
    headers: { Cookie: cookiePaused },
    redirect: "manual",
  });
  const html = await res.text();
  if (!html.includes("Subscription paused") && !html.includes("Manage billing"))
    throw new Error("paused tenant does not see BillingRequired");
});

// ─── Cleanup ───────────────────────────────────────────────────────────────
section("Cleanup");
await check("delete Tenant A", async () =>
  void (await sql.query(`DELETE FROM tenants WHERE id = $1`, [tenA])),
);
await check("delete Tenant B", async () =>
  void (await sql.query(`DELETE FROM tenants WHERE id = $1`, [tenB])),
);
await check("delete paused tenant", async () =>
  void (await sql.query(`DELETE FROM tenants WHERE id = $1`, [pausedTenant])),
);
await check("delete users", async () =>
  void (await sql.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [
    [userOwnerA, userViewerA, userOwnerB, pausedUser],
  ])),
);

console.log(`\n━━━ RESULT ━━━`);
console.log(`  ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log(`\nFailures:`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
