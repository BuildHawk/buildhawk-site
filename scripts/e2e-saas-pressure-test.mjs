#!/usr/bin/env node
/**
 * End-to-end SaaS pressure test.
 *
 * Walks a fresh tenant through the entire onboarding loop using real HTTP
 * calls against production, plus DB queries to bypass the email step (we read
 * the raw magic-link token directly out of magic_links and consume it).
 *
 * Cleans up after itself.
 */

import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const ENV_PATH = process.env.ENV_FILE || ".env.production.local";
try {
  for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)="(.*)"$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const SITE = process.env.SITE_URL ?? "https://www.buildhawk.com.au";

const sql = neon(process.env.DATABASE_URL);
const stamp = Date.now();
const TEST_EMAIL = `e2e+${stamp}@buildhawk.com.au`;
const TEST_TENANT = `E2E ${stamp}`;

const pass = (m) => console.log(`✓ ${m}`);
const fail = (m) => {
  console.error(`✗ ${m}`);
  process.exitCode = 1;
};
const info = (m) => console.log(`· ${m}`);

const headers = (cookie) => ({
  "content-type": "application/json",
  ...(cookie ? { cookie } : {}),
});

// Force Vercel IP so local DNS quirks don't break us.
const fetchSite = async (path, init = {}) => {
  const url = `${SITE}${path}`;
  // Node fetch can't override DNS, so fall back to manually adding Host header
  // when SITE points at a Vercel-managed domain. Since we hit a Vercel preview
  // URL when SITE_URL is overridden, this just works.
  return fetch(url, { redirect: "manual", ...init });
};

const fetchCookie = (res) => res.headers.get("set-cookie") ?? null;

async function main() {
  info(`Test email: ${TEST_EMAIL}`);
  info(`Site: ${SITE}`);

  /* 1. Marketing pages render */
  {
    const home = await fetchSite("/");
    if (home.status === 200) pass("Marketing landing returns 200");
    else fail(`Landing returned ${home.status}`);
    const html = await home.text();
    for (const needle of [
      "Bring your own stack",
      "GoHighLevel",
      "Start free trial",
      "/command-centre/signup",
    ]) {
      if (html.includes(needle)) pass(`Landing contains "${needle}"`);
      else fail(`Landing missing "${needle}"`);
    }
  }

  /* 2. Signup endpoint creates magic link in DB */
  {
    const res = await fetchSite("/api/command-centre/auth/signup", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        email: TEST_EMAIL,
        name: "E2E Tester",
        tenantName: TEST_TENANT,
        plan: "starter",
      }),
    });
    const body = await res.json();
    if (res.status === 200 && body.ok) pass("POST /signup returns ok");
    else fail(`POST /signup failed: ${res.status} ${JSON.stringify(body)}`);
  }

  /* 3. Pull the raw token by re-issuing a fresh magic link via internal DB read
   *    is impossible (tokens are hashed). Instead, issue our own token directly. */
  // The magic link token is created by issueMagicLink with randomBytes(32).toString("base64url").
  // We can't recover it, but we CAN insert our own row and verify against it.
  const { default: crypto } = await import("node:crypto");
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const id = `mgl_${crypto.randomBytes(10).toString("hex")}`;
  await sql`INSERT INTO magic_links (id, token_hash, email, purpose, redirect, metadata, expires_at)
    VALUES (${id}, ${tokenHash}, ${TEST_EMAIL}, 'signup', '/command-centre',
      ${JSON.stringify({ name: "E2E Tester", tenantName: TEST_TENANT, plan: "starter" })}::jsonb,
      ${new Date(Date.now() + 30 * 60 * 1000).toISOString()})`;

  /* 4. Verify endpoint consumes token + sets session */
  let sessionCookie = null;
  {
    const res = await fetchSite(
      `/api/command-centre/auth/verify?token=${encodeURIComponent(rawToken)}`,
    );
    if (res.status === 307 || res.status === 302) pass("GET /verify redirects");
    else fail(`GET /verify returned ${res.status}`);
    const cookies = fetchCookie(res);
    if (cookies && cookies.includes("bh_session=")) {
      pass("Session cookie set after verify");
      // Pull just the bh_session=value pair.
      sessionCookie = cookies.split(",").map((c) => c.trim().split(";")[0]).filter((c) => c.startsWith("bh_session=")).join("; ");
    } else fail("No session cookie issued");
  }

  /* 5. Verify tenant + user + membership rows exist */
  {
    const rows = await sql`SELECT t.id as tenant_id, t.name, t.plan, t.status, u.id as user_id,
        m.role
      FROM users u
      LEFT JOIN memberships m ON m.user_id = u.id
      LEFT JOIN tenants t ON t.id = m.tenant_id
      WHERE u.email = ${TEST_EMAIL}`;
    if (rows.length === 1 && rows[0].name === TEST_TENANT && rows[0].role === "owner") {
      pass(`Tenant ${rows[0].tenant_id} created with owner membership`);
    } else fail(`Unexpected tenant rows: ${JSON.stringify(rows)}`);
  }

  /* 6. /whoami returns the active session */
  {
    const res = await fetchSite("/api/command-centre/auth/whoami", {
      headers: headers(sessionCookie),
    });
    const body = await res.json();
    if (body.signedIn && body.email === TEST_EMAIL) pass("/whoami returns active session");
    else fail(`/whoami unexpected: ${JSON.stringify(body)}`);
  }

  /* 7. Request a connector + verify it's audit-logged */
  {
    const res = await fetchSite("/api/command-centre/integrations/request", {
      method: "POST",
      headers: headers(sessionCookie),
      body: JSON.stringify({ connectorId: "procore", note: "E2E test request" }),
    });
    const body = await res.json();
    if (body.ok) pass("Connector request accepted");
    else fail(`Connector request failed: ${JSON.stringify(body)}`);
  }
  {
    const rows = await sql`SELECT action, target FROM audit_events
      WHERE actor_email = ${TEST_EMAIL} AND action = 'integration.requested'`;
    if (rows.length >= 1) pass(`Audit event recorded for connector request (target=${rows[0].target})`);
    else fail("No audit event for connector request");
  }

  /* 8. Team list returns just the owner */
  {
    const res = await fetchSite("/api/command-centre/members", {
      headers: headers(sessionCookie),
    });
    const body = await res.json();
    if (body.ok && body.members.length === 1 && body.members[0].role === "owner") {
      pass("Team list returns owner only on fresh tenant");
    } else fail(`Unexpected team list: ${JSON.stringify(body)}`);
  }

  /* 9. Invite a teammate, verify it lands as pending */
  const inviteeEmail = `e2e-invitee+${stamp}@buildhawk.com.au`;
  {
    const res = await fetchSite("/api/command-centre/members/invite", {
      method: "POST",
      headers: headers(sessionCookie),
      body: JSON.stringify({ email: inviteeEmail, role: "director" }),
    });
    const body = await res.json();
    if (body.ok && body.inviteId) pass(`Invite created: ${body.inviteId}`);
    else fail(`Invite failed: ${JSON.stringify(body)}`);
  }
  {
    const res = await fetchSite("/api/command-centre/members", {
      headers: headers(sessionCookie),
    });
    const body = await res.json();
    const found = body.members.find((m) => m.email === inviteeEmail && m.isInvite);
    if (found) pass("Pending invite shows in team list");
    else fail("Pending invite missing from team list");
  }

  /* 10. Logout clears session */
  {
    const res = await fetchSite("/api/command-centre/auth/logout", {
      headers: headers(sessionCookie),
    });
    if (res.status === 302 || res.status === 303 || res.status === 307)
      pass("Logout redirects to login");
    else fail(`Logout returned ${res.status}`);
  }

  /* 11. Cleanup */
  {
    const tenants = await sql`SELECT t.id FROM tenants t
      INNER JOIN memberships m ON m.tenant_id = t.id
      INNER JOIN users u ON u.id = m.user_id
      WHERE u.email = ${TEST_EMAIL}`;
    for (const t of tenants) {
      await sql`DELETE FROM tenants WHERE id = ${t.id}`;
    }
    await sql`DELETE FROM users WHERE email = ${TEST_EMAIL}`;
    await sql`DELETE FROM magic_links WHERE email = ${TEST_EMAIL}`;
    info("Cleanup complete");
  }
}

main().catch((e) => {
  fail(`Crash: ${e?.stack ?? e}`);
});
