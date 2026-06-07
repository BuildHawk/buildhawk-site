#!/usr/bin/env node
/**
 * Round 2 pressure test — admin RBAC, Stripe webhook signature, signout,
 * cascade deletes, benchmark filters, invite flow, AI smoke.
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

// ─── Seed: Tenant with owner + admin + viewer ───────────────────────────────
section("Setup: tenant with owner/admin/viewer/director");
const tid = rid("ten");
const ownerId = rid("usr");
const adminId = rid("usr");
const directorId = rid("usr");
const ownerEmail = `owner+${Date.now()}@test.local`;
const adminEmail = `admin+${Date.now()}@test.local`;
const directorEmail = `director+${Date.now()}@test.local`;

await check("seed tenant + roles", async () => {
  await sql.query(
    `INSERT INTO tenants (id, slug, name, plan, status, trial_ends_at)
     VALUES ($1, $2, 'Round2 Tenant', 'pro', 'trialing', now() + interval '14 days')`,
    [tid, `r2-${Date.now().toString(36)}`],
  );
  await sql.query(
    `INSERT INTO users (id, email, email_verified) VALUES ($1,$2,true),($3,$4,true),($5,$6,true)`,
    [ownerId, ownerEmail, adminId, adminEmail, directorId, directorEmail],
  );
  await sql.query(
    `INSERT INTO memberships (id, tenant_id, user_id, role) VALUES
       ($1, $2, $3, 'owner'),
       ($4, $5, $6, 'admin'),
       ($7, $8, $9, 'director')`,
    [
      rid("mem"), tid, ownerId,
      rid("mem"), tid, adminId,
      rid("mem"), tid, directorId,
    ],
  );
});

const cookieOwner = await mintSession(ownerEmail);
const cookieAdmin = await mintSession(adminEmail);
const cookieDirector = await mintSession(directorEmail);

// ─── Admin role: positive RBAC ──────────────────────────────────────────────
section("Admin role can access admin endpoints");

await check("admin GETs audit (200)", async () => {
  const res = await fetchSite("/api/command-centre/audit", { headers: { Cookie: cookieAdmin } });
  if (res.status !== 200) throw new Error(`admin audit ${res.status}`);
});

await check("admin POSTs integrations/ghl (200)", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    method: "POST",
    headers: { Cookie: cookieAdmin, "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: "pit-admin-test-aaaa-bbbb-cccc",
      locationId: "ADMIN_LOC",
    }),
  });
  if (res.status !== 200) throw new Error(`admin POST ghl ${res.status}`);
});

await check("admin DELETEs integrations/ghl (200)", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    method: "DELETE",
    headers: { Cookie: cookieAdmin },
  });
  if (res.status !== 200) throw new Error(`admin DELETE ghl ${res.status}`);
});

// ─── Director role (NOT admin/owner) — should be rejected from admin paths ──
section("Director role rejected from admin endpoints");

await check("director GETs audit → 403", async () => {
  const res = await fetchSite("/api/command-centre/audit", {
    headers: { Cookie: cookieDirector },
  });
  if (res.status !== 403)
    throw new Error(`director audit should be 403, got ${res.status}`);
});

await check("director POSTs integrations/ghl → 403", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    method: "POST",
    headers: { Cookie: cookieDirector, "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: "pit-x", locationId: "x" }),
  });
  if (res.status !== 403)
    throw new Error(`director POST ghl should be 403, got ${res.status}`);
});

await check("director can still GET integrations/ghl (read OK)", async () => {
  const res = await fetchSite("/api/command-centre/integrations/ghl", {
    headers: { Cookie: cookieDirector },
  });
  if (res.status !== 200) throw new Error(`director GET ghl ${res.status}`);
});

await check("director can still GET members list", async () => {
  const res = await fetchSite("/api/command-centre/members", {
    headers: { Cookie: cookieDirector },
  });
  if (res.status !== 200) throw new Error(`director members ${res.status}`);
});

// ─── Stripe webhook signature verification ──────────────────────────────────
section("Stripe webhook signature verification");

await check("Stripe webhook with no signature header → rejects", async () => {
  const res = await fetchSite("/api/command-centre/stripe/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "checkout.session.completed", data: { object: {} } }),
  });
  // Expect 400/401/503 — anything except 200, which would mean we processed
  // an unsigned event as legit.
  if (res.status === 200)
    throw new Error("unsigned webhook accepted (CRITICAL — would let attackers fake events)");
});

await check("Stripe webhook with bogus signature → rejects", async () => {
  const res = await fetchSite("/api/command-centre/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "t=1234,v1=bogusBogusBogusBogus",
    },
    body: JSON.stringify({ type: "checkout.session.completed", data: { object: {} } }),
  });
  if (res.status === 200)
    throw new Error("forged signature accepted");
});

// ─── Signout flow ───────────────────────────────────────────────────────────
section("Signout flow");

await check("POST /api/command-centre/auth/logout clears cookie", async () => {
  const res = await fetchSite("/api/command-centre/auth/logout", {
    method: "POST",
    headers: { Cookie: cookieAdmin },
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  if (!setCookie.includes("bh_session=") && !setCookie.includes("Max-Age=0"))
    throw new Error(`signout didn't clear cookie: ${setCookie}`);
});

await check("whoami after logout returns signedIn:false (cookie cleared in response)", async () => {
  // The logout response sets bh_session= with Max-Age=0. We capture that
  // and use it on a follow-up whoami — the empty cookie should be treated
  // as no session.
  const logoutRes = await fetchSite("/api/command-centre/auth/logout", {
    method: "POST",
    headers: { Cookie: cookieAdmin },
    redirect: "manual",
  });
  const sc = logoutRes.headers.get("set-cookie") ?? "";
  const m = sc.match(/bh_session=([^;]*)/);
  const cleared = m?.[1] ?? "";
  const res = await fetchSite("/api/command-centre/auth/whoami", {
    headers: { Cookie: `bh_session=${cleared}` },
  });
  const j = await res.json();
  if (j.signedIn !== false)
    throw new Error(`whoami after logout should be signedIn:false, got: ${JSON.stringify(j)}`);
});

// ─── Tenant deletion cascade ────────────────────────────────────────────────
section("Tenant deletion cascade");

const cascadeTid = rid("ten");
const cascadeUid = rid("usr");
const cascadeEmail = `cascade+${Date.now()}@test.local`;

await check("seed cascade tenant + dependent rows", async () => {
  await sql.query(
    `INSERT INTO tenants (id, slug, name, plan, status, trial_ends_at)
     VALUES ($1, $2, 'Cascade Tenant', 'starter', 'trialing', now() + interval '14 days')`,
    [cascadeTid, `cas-${Date.now().toString(36)}`],
  );
  await sql.query(
    `INSERT INTO users (id, email, email_verified) VALUES ($1,$2,true)`,
    [cascadeUid, cascadeEmail],
  );
  await sql.query(
    `INSERT INTO memberships (id, tenant_id, user_id, role) VALUES ($1,$2,$3,'owner')`,
    [rid("mem"), cascadeTid, cascadeUid],
  );
  // Seed an audit event manually so we can verify it cascades
  await sql.query(
    `INSERT INTO audit_events (id, tenant_id, actor_email, action) VALUES ($1,$2,$3,'test.event')`,
    [rid("aud"), cascadeTid, cascadeEmail],
  );
  // Seed a benchmark sample
  await sql.query(
    `INSERT INTO benchmark_samples (id, tenant_id, source_opportunity_id, source_award_id, region, trade_section, project_type, awarded_value)
     VALUES ($1, $2, 'opp_x', 'award_x', 'Test Region', 'Test Trade', 'Test Type', 100000)`,
    [rid("bsm"), cascadeTid],
  );
});

await check("seeded rows exist before cascade", async () => {
  const a = await sql.query(`SELECT count(*)::int as c FROM memberships WHERE tenant_id=$1`, [cascadeTid]);
  const b = await sql.query(`SELECT count(*)::int as c FROM audit_events WHERE tenant_id=$1`, [cascadeTid]);
  const c = await sql.query(`SELECT count(*)::int as c FROM benchmark_samples WHERE tenant_id=$1`, [cascadeTid]);
  if (a[0].c !== 1 || b[0].c !== 1 || c[0].c !== 1)
    throw new Error(`seeds missing: mem=${a[0].c} aud=${b[0].c} bench=${c[0].c}`);
});

await check("DELETE tenant cascades to memberships + audit + benchmark_samples", async () => {
  await sql.query(`DELETE FROM tenants WHERE id = $1`, [cascadeTid]);
  const a = await sql.query(`SELECT count(*)::int as c FROM memberships WHERE tenant_id=$1`, [cascadeTid]);
  const b = await sql.query(`SELECT count(*)::int as c FROM audit_events WHERE tenant_id=$1`, [cascadeTid]);
  const c = await sql.query(`SELECT count(*)::int as c FROM benchmark_samples WHERE tenant_id=$1`, [cascadeTid]);
  if (a[0].c !== 0 || b[0].c !== 0 || c[0].c !== 0)
    throw new Error(`cascade incomplete: mem=${a[0].c} aud=${b[0].c} bench=${c[0].c}`);
});

await sql.query(`DELETE FROM users WHERE id = $1`, [cascadeUid]);

// ─── Hawktress benchmarks with filters ──────────────────────────────────────
section("Hawktress benchmarks filters");

await check("benchmarks accepts region/trade/projectType query", async () => {
  const res = await fetchSite(
    "/api/command-centre/hawktress/benchmarks?region=Geelong+VIC&trade=Framing&projectType=Duplex",
    { headers: { Cookie: cookieOwner } },
  );
  if (res.status !== 200) throw new Error(`status ${res.status}`);
  const j = await res.json();
  if (!j.ok || !Array.isArray(j.cells))
    throw new Error("bad payload");
});

// ─── Member invite flow ────────────────────────────────────────────────────
section("Member invite flow");

const inviteeEmail = `invitee+${Date.now()}@test.local`;

await check("owner creates an invite (POST /members/invite)", async () => {
  const res = await fetchSite("/api/command-centre/members/invite", {
    method: "POST",
    headers: { Cookie: cookieOwner, "Content-Type": "application/json" },
    body: JSON.stringify({ email: inviteeEmail, role: "estimator" }),
  });
  if (res.status !== 200) throw new Error(`invite create ${res.status}: ${await res.text()}`);
  const j = await res.json();
  if (!j.ok) throw new Error("invite not ok");
});

await check("invitation row exists with status=pending and correct role", async () => {
  const rows = await sql.query(
    `SELECT id, role, status FROM invitations WHERE email = $1 AND tenant_id = $2`,
    [inviteeEmail, tid],
  );
  if (rows.length !== 1) throw new Error(`expected 1 invite, got ${rows.length}`);
  if (rows[0].role !== "estimator")
    throw new Error(`wrong role: ${rows[0].role}`);
  if (rows[0].status !== "pending")
    throw new Error(`wrong status: ${rows[0].status}`);
});

await check("members API surfaces the pending invite", async () => {
  const res = await fetchSite("/api/command-centre/members", { headers: { Cookie: cookieOwner } });
  const j = await res.json();
  const pending = j.members.find((m) => m.email === inviteeEmail && m.isInvite);
  if (!pending) throw new Error("pending invite not surfaced in members");
});

// ─── AI intelligence smoke ─────────────────────────────────────────────────
section("AI intelligence endpoint smoke");

await check("portfolio brief endpoint returns 200 or 503 (AI configured?)", async () => {
  const res = await fetchSite("/api/command-centre/intelligence/portfolio", {
    method: "POST",
    headers: { Cookie: cookieOwner, "Content-Type": "application/json" },
    body: JSON.stringify({
      builder: "Round2 Tenant",
      region: "VIC",
      projectCount: 0,
      totalContract: 0,
      totalCommitted: 0,
      totalInvoiced: 0,
      blendedMargin: 0,
      targetMargin: 17,
      debtor90Plus: 0,
      netCash90: 0,
      projects: [],
    }),
  });
  if (res.status !== 200 && res.status !== 503)
    throw new Error(`unexpected status ${res.status}`);
});

await check("intelligence/ask requires auth (401 without cookie)", async () => {
  const res = await fetchSite("/api/command-centre/intelligence/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "test", context: {} }),
  });
  if (res.status !== 401) throw new Error(`unauth ask should be 401, got ${res.status}`);
});

// ─── Cleanup ───────────────────────────────────────────────────────────────
section("Cleanup");
await check("delete Round2 tenant", async () =>
  void (await sql.query(`DELETE FROM tenants WHERE id = $1`, [tid])),
);
await check("delete Round2 users", async () =>
  void (await sql.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [
    [ownerId, adminId, directorId],
  ])),
);

console.log(`\n━━━ RESULT ━━━`);
console.log(`  ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log(`\nFailures:`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
