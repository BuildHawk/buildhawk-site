#!/usr/bin/env node
/**
 * Multi-account pressure test.
 *
 * Walks every accessible surface from each account perspective:
 *
 *   ANONYMOUS                  no cookie. Should see public pages, get
 *                              gated everywhere else.
 *   PASSWORD SIGN-IN           johnphilpsc@gmail.com using credentials.
 *                              Walks every console page + API.
 *   MAGIC-LINK SIGN-IN         same email, magic-link path. Verifies it
 *                              still works as a fallback.
 *   FORGED SESSION             tampered cookie. Should be rejected.
 *   NON-ALLOWLISTED EMAIL      lockdown drops silently.
 *   WRONG PASSWORD             returns generic 401.
 *
 * Plus a console-page walk verifying every URL returns 200 (not 5xx) when
 * authenticated, with real data flowing.
 */

import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.production.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)="(.*)"$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SITE = "https://www.buildhawk.com.au";
const ALLOWLISTED = "johnphilpsc@gmail.com";
const PASSWORD = process.env.E2E_PASSWORD ?? readFileSync("/tmp/john_pwd.tmp", "utf8").trim();
const sql = neon(process.env.DATABASE_URL);

let passes = 0;
let fails = 0;
const failures = [];

const pass = (m) => {
  passes++;
  console.log(`  ✓ ${m}`);
};
const fail = (m, d) => {
  fails++;
  failures.push({ m, d });
  console.error(`  ✗ ${m}${d ? ` — ${typeof d === "string" ? d : JSON.stringify(d).slice(0, 280)}` : ""}`);
};
const section = (t) => console.log(`\n━━━ ${t} ━━━`);

const fetchSite = (path, init = {}) =>
  fetch(`${SITE}${path}`, { redirect: "manual", ...init });

const getSessionCookie = (res) => {
  const sc = res.headers.get("set-cookie") ?? "";
  return sc.split(",").map((c) => c.trim().split(";")[0]).find((c) => c.startsWith("bh_session="));
};

/* ─────────────────────────────────────────────────────────────────── */
async function anonymousAccount() {
  section("Account: ANONYMOUS (no cookie)");

  // Public pages
  for (const path of [
    "/",
    "/articles",
    "/faq",
    "/data-policy",
    "/insights",
    "/partners",
    "/command-centre/login",
    "/command-centre/request-access",
  ]) {
    const r = await fetchSite(path);
    if (r.status === 200) pass(`Public ${path} → 200`);
    else fail(`Public ${path} returned ${r.status}`);
  }

  // Gated pages should 307 to login
  for (const path of [
    "/command-centre",
    "/command-centre/new-project",
    "/command-centre/projects/kdfLhpK75u3s28XIfgkM/edit",
    "/command-centre/architecture",
    "/command-centre/settings",
    "/command-centre/onboarding",
  ]) {
    const r = await fetchSite(path);
    if (r.status === 307) pass(`Gated ${path} → 307`);
    else fail(`Gated ${path} returned ${r.status}`);
  }

  // Signup redirects to login (lockdown)
  const su = await fetchSite("/command-centre/signup");
  if (su.status === 307 && su.headers.get("location")?.includes("invitationOnly=1"))
    pass("Signup page → login?invitationOnly=1 (lockdown)");
  else fail(`Signup didn't redirect correctly: ${su.status} ${su.headers.get("location")}`);

  // Gated APIs should 401
  for (const path of [
    "/api/command-centre/members",
    "/api/command-centre/audit",
    "/api/command-centre/integrations/ghl",
  ]) {
    const r = await fetchSite(path);
    if (r.status === 401) pass(`API ${path} → 401`);
    else fail(`API ${path} returned ${r.status}`);
  }

  // /whoami returns signedIn:false
  const who = await fetchSite("/api/command-centre/auth/whoami");
  const body = await who.json();
  if (!body.signedIn) pass("whoami returns signedIn:false");
  else fail(`whoami unexpectedly signed in: ${JSON.stringify(body)}`);
}

/* ─────────────────────────────────────────────────────────────────── */
async function wrongCredentialsAccount() {
  section("Account: WRONG CREDENTIALS");

  // Wrong password for allowlisted email
  const r1 = await fetchSite("/api/command-centre/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ALLOWLISTED, password: "definitelyWrongPassword99" }),
  });
  const b1 = await r1.json();
  if (r1.status === 401 && !b1.ok) pass(`Wrong password → 401 "${b1.error}"`);
  else fail(`Wrong password returned ${r1.status} ${JSON.stringify(b1)}`);
  if (!getSessionCookie(r1)) pass("Wrong password: no session cookie issued");
  else fail("Wrong password: session cookie was issued");

  // Right password but non-allowlisted email
  const r2 = await fetchSite("/api/command-centre/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `random-${Date.now()}@example.com`, password: PASSWORD }),
  });
  await r2.text().catch(() => "");
  if (r2.status === 401) pass("Non-allowlisted email → 401 (lockdown)");
  else fail(`Non-allowlisted login returned ${r2.status}`);

  // Empty body / malformed
  const r3 = await fetchSite("/api/command-centre/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not json",
  });
  if (r3.status === 400) pass("Malformed JSON → 400");
  else fail(`Malformed JSON returned ${r3.status}`);
}

/* ─────────────────────────────────────────────────────────────────── */
async function passwordSignInAccount() {
  section("Account: PASSWORD SIGN-IN (johnphilpsc@gmail.com)");

  const t0 = performance.now();
  const r = await fetchSite("/api/command-centre/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ALLOWLISTED, password: PASSWORD }),
  });
  const ms = Math.round(performance.now() - t0);
  const body = await r.json();
  if (r.status === 200 && body.ok) pass(`/auth/login → 200 (${ms}ms)`);
  else {
    fail(`/auth/login failed: ${r.status} ${JSON.stringify(body)}`);
    return;
  }

  const cookie = getSessionCookie(r);
  if (!cookie) {
    fail("No session cookie issued");
    return;
  }
  pass(`Session cookie issued (${cookie.length} chars)`);

  // /whoami should confirm
  const who = await fetchSite("/api/command-centre/auth/whoami", { headers: { cookie } });
  const whoBody = await who.json();
  if (whoBody.signedIn && whoBody.email === ALLOWLISTED) pass(`whoami confirms ${whoBody.email}`);
  else fail(`whoami unexpected: ${JSON.stringify(whoBody)}`);

  // Verify last_signed_in_at was updated
  const dbRows = await sql`SELECT last_signed_in_at FROM users WHERE email = ${ALLOWLISTED}`;
  const lastSignedIn = dbRows[0]?.last_signed_in_at;
  if (lastSignedIn && new Date(lastSignedIn).getTime() > Date.now() - 60_000)
    pass(`last_signed_in_at updated (${lastSignedIn})`);
  else fail(`last_signed_in_at stale: ${lastSignedIn}`);

  // Walk every authed console page
  for (const path of [
    "/command-centre",
    "/command-centre/architecture",
    "/command-centre/settings",
    "/command-centre/new-project",
    "/command-centre/projects/kdfLhpK75u3s28XIfgkM/edit",
  ]) {
    const t = performance.now();
    const r = await fetchSite(path, { headers: { cookie } });
    const ms = Math.round(performance.now() - t);
    if (r.status === 200) pass(`Authed ${path} → 200 (${ms}ms)`);
    else if (r.status >= 500) fail(`Authed ${path} → ${r.status} (server error)`);
    else fail(`Authed ${path} → ${r.status}`);
  }

  // Walk every authed API
  const apis = [
    { path: "/api/command-centre/members", expect: (b) => b.ok && Array.isArray(b.members) },
    { path: "/api/command-centre/audit", expect: (b) => b.ok && Array.isArray(b.events) },
    { path: "/api/command-centre/integrations/ghl", expect: (b) => b.ok },
  ];
  for (const { path, expect } of apis) {
    const r = await fetchSite(path, { headers: { cookie } });
    const b = await r.json();
    if (r.status === 200 && expect(b)) pass(`Authed API ${path} → ok`);
    else fail(`Authed API ${path} unexpected: ${r.status} ${JSON.stringify(b).slice(0, 160)}`);
  }

  // Specifically verify the dashboard renders live GHL data for HBNH
  const dash = await fetchSite("/command-centre", { headers: { cookie } });
  const html = await dash.text();
  const needles = [
    "Cost Plan Console",
    "Active estimates",
    "Powered by Hawktress",
    "New estimate",
    "Export report",
  ];
  for (const n of needles) {
    if (html.includes(n)) pass(`Dashboard contains "${n}"`);
    else fail(`Dashboard missing "${n}"`);
  }
  // Confirm live data is flowing (Homes by NH project names should appear)
  const realProjects = ["Autumn", "Apollo Bay", "Fyansford", "Cambridge"];
  const realMatches = realProjects.filter((p) => html.includes(p));
  if (realMatches.length >= 2) pass(`Live GHL data: ${realMatches.length} HBNH project names rendered`);
  else fail(`Live data thin: only ${realMatches.length} project names visible`);

  // Audit log should contain at least one auth.password.signin event
  const auditRes = await fetchSite("/api/command-centre/audit", { headers: { cookie } });
  const auditBody = await auditRes.json();
  const signinEvents = (auditBody.events ?? []).filter((e) => e.action === "auth.password.signin");
  if (signinEvents.length >= 1) pass(`Audit log has ${signinEvents.length} auth.password.signin event(s)`);
  else fail(`Audit log missing auth.password.signin events`);

  // Logout
  const lo = await fetchSite("/api/command-centre/auth/logout", { headers: { cookie } });
  if ([200, 302, 303, 307].includes(lo.status)) pass(`Logout → ${lo.status}`);
  else fail(`Logout returned ${lo.status}`);

  // The set-cookie on logout should clear bh_session
  const clearSc = lo.headers.get("set-cookie") ?? "";
  if (clearSc.includes("bh_session=") && (clearSc.includes("Max-Age=0") || clearSc.includes("expires=Thu, 01 Jan 1970")))
    pass("Logout cleared session cookie");
  else fail(`Logout did not clear cookie: ${clearSc.slice(0, 160)}`);
}

/* ─────────────────────────────────────────────────────────────────── */
async function magicLinkAccount() {
  section("Account: MAGIC-LINK SIGN-IN (johnphilpsc@gmail.com)");

  // Inject a magic link directly (bypassing email delivery)
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const id = `mgl_pt_${randomBytes(8).toString("hex")}`;
  await sql`INSERT INTO magic_links (id, token_hash, email, purpose, redirect, expires_at)
    VALUES (${id}, ${tokenHash}, ${ALLOWLISTED}, 'signin', '/command-centre',
      ${new Date(Date.now() + 30 * 60 * 1000).toISOString()})`;
  pass("Magic link inserted via DB");

  const r = await fetchSite(`/api/command-centre/auth/verify?token=${encodeURIComponent(rawToken)}`);
  if (r.status === 307 || r.status === 302) pass(`/auth/verify → ${r.status}`);
  else fail(`/auth/verify returned ${r.status}`);

  const cookie = getSessionCookie(r);
  if (cookie) pass("Session cookie issued via magic link");
  else fail("No cookie from magic-link verify");

  // Verify using the magic-link session
  const who = await fetchSite("/api/command-centre/auth/whoami", { headers: { cookie: cookie ?? "" } });
  const whoBody = await who.json();
  if (whoBody.signedIn && whoBody.email === ALLOWLISTED) pass("Magic-link session active");
  else fail(`Magic-link session unexpected: ${JSON.stringify(whoBody)}`);

  // Token cannot be replayed
  const replay = await fetchSite(`/api/command-centre/auth/verify?token=${encodeURIComponent(rawToken)}`);
  const loc = replay.headers.get("location");
  if (replay.status === 307 && loc?.includes("error=expired"))
    pass("Magic-link replay rejected (error=expired)");
  else fail(`Replay unexpectedly returned ${replay.status} ${loc}`);

  // Cleanup
  await sql`DELETE FROM magic_links WHERE id = ${id}`;
}

/* ─────────────────────────────────────────────────────────────────── */
async function forgedSessionAccount() {
  section("Account: FORGED SESSION (tampered cookie)");

  const forged = [
    "bh_session=eyJ0aGlzIjoiZmFrZSJ9.fakeSig",
    `bh_session=${Buffer.from(JSON.stringify({ userId: "usr_fake", tenantId: "ten_fake", email: "evil@example.com", exp: Math.floor(Date.now() / 1000) + 86400 })).toString("base64url")}.fakeHmac`,
    "bh_session=expired.expired",
  ];
  for (const c of forged) {
    const r = await fetchSite("/api/command-centre/auth/whoami", { headers: { cookie: c } });
    const b = await r.json();
    if (!b.signedIn) pass(`Forged cookie rejected: ${c.slice(0, 30)}…`);
    else fail(`Forged cookie accepted: ${JSON.stringify(b)}`);
  }

  // Forged cookie on a protected API also fails
  const r = await fetchSite("/api/command-centre/members", { headers: { cookie: forged[0] } });
  if (r.status === 401) pass("Forged cookie on members API → 401");
  else fail(`Forged cookie on members API → ${r.status}`);
}

/* ─────────────────────────────────────────────────────────────────── */
async function dataIntegrity() {
  section("Data integrity (server-side via DB)");

  const tenants = await sql`SELECT id, name, plan, status FROM tenants`;
  if (tenants.length === 1 && tenants[0].name === "Homes by NH")
    pass(`Single tenant: ${tenants[0].name} (${tenants[0].plan}/${tenants[0].status})`);
  else fail(`Unexpected tenants: ${JSON.stringify(tenants)}`);

  const users = await sql`SELECT email FROM users ORDER BY email`;
  if (users.length === 1 && users[0].email === ALLOWLISTED)
    pass(`Single user: ${users[0].email}`);
  else fail(`Unexpected users: ${JSON.stringify(users)}`);

  const memberships = await sql`SELECT u.email, m.role FROM memberships m INNER JOIN users u ON u.id = m.user_id`;
  if (memberships.length === 1 && memberships[0].role === "owner")
    pass(`Single owner membership: ${memberships[0].email}`);
  else fail(`Unexpected memberships: ${JSON.stringify(memberships)}`);

  const integrations = await sql`SELECT kind, is_active FROM integrations`;
  const ghl = integrations.find((i) => i.kind === "ghl");
  if (ghl?.is_active) pass(`GHL integration active`);
  else fail(`GHL integration missing/inactive: ${JSON.stringify(integrations)}`);

  const passwordSet = await sql`SELECT (password_hash IS NOT NULL) AS has_pwd FROM users WHERE email = ${ALLOWLISTED}`;
  if (passwordSet[0]?.has_pwd) pass(`Password hash set for ${ALLOWLISTED}`);
  else fail(`Password hash missing for ${ALLOWLISTED}`);
}

async function main() {
  console.log(`Multi-account pressure test — ${SITE}\n`);
  await anonymousAccount();
  await wrongCredentialsAccount();
  await passwordSignInAccount();
  await magicLinkAccount();
  await forgedSessionAccount();
  await dataIntegrity();

  console.log(`\n━━━ Summary ━━━`);
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${fails}`);
  if (fails > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  · ${f.m}`);
    process.exitCode = 1;
  } else {
    console.log(`\n  100% green ✓`);
  }
}

main().catch((e) => {
  console.error("CRASH:", e);
  process.exitCode = 1;
});
