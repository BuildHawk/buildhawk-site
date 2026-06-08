#!/usr/bin/env node
/**
 * Post-deploy smoke test for the /peace-of-mind form + /api/peace-of-mind/start.
 *
 * Usage:
 *   node scripts/smoke-peace-of-mind.mjs                   # hits production
 *   SITE_URL=https://preview.example.com node ...          # hits a preview
 *   SMOKE_TIMEOUT_MS=15000 node ...                        # adjust per-call timeout
 *
 * Exit codes:
 *   0 - All checks passed.
 *   1 - Route is missing or returning 5xx (a real deploy break).
 *
 * Env-var state issues (BLOB_READ_WRITE_TOKEN unset etc.) are reported as
 * warnings, not failures. The deploy is healthy as long as the route is alive
 * and behaving correctly given its configuration.
 */

const SITE_URL = (process.env.SITE_URL || "https://www.buildhawk.com.au").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 10000);

let warnings = 0;

function log(msg) { process.stdout.write(`${msg}\n`); }
function pass(msg) { log(`  PASS  ${msg}`); }
function fail(msg) { log(`  FAIL  ${msg}`); process.exit(1); }
function warn(msg) { log(`  WARN  ${msg}`); warnings++; }

async function withTimeout(promise, ms, label) {
  let timeoutHandle;
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function check1_pageReachable() {
  log("1. Page reachable");
  const url = `${SITE_URL}/peace-of-mind`;
  const res = await withTimeout(fetch(url, { redirect: "follow" }), TIMEOUT_MS, "page fetch");
  if (res.status !== 200) fail(`GET ${url} returned ${res.status}`);
  const body = await res.text();
  if (!body.includes('id="start"')) fail("page is missing the #start anchor");
  if (!body.includes("Send for review")) fail('page is missing the "Send for review" submit label');
  if (body.includes("mailto:info@buildhawk.com.au?subject=Peace%20of%20Mind")) {
    fail("page still contains a Peace of Mind mailto CTA - did the deploy regress?");
  }
  pass(`GET ${url} -> 200, form section present, no mailto CTAs`);
}

async function check2_routeAliveValidation() {
  log("2. API route alive (validation works)");
  const url = `${SITE_URL}/api/peace-of-mind/start`;
  const fd = new FormData();
  fd.set("x", "y"); // empty-of-required-fields submission
  const res = await withTimeout(fetch(url, { method: "POST", body: fd }), TIMEOUT_MS, "validation probe");
  if (res.status === 404) fail(`POST ${url} returned 404 - route is missing`);
  if (res.status >= 500 && res.status !== 503) fail(`POST ${url} returned ${res.status} - handler crash`);
  const json = await res.json().catch(() => ({}));
  if (res.status !== 400) {
    warn(`expected 400 on empty body, got ${res.status} (body: ${JSON.stringify(json).slice(0, 120)})`);
  } else {
    pass(`POST ${url} (empty) -> 400 "${json.error || "no error message"}"`);
  }
}

async function check3_envState() {
  log("3. Env-var health (informational)");
  const url = `${SITE_URL}/api/health`;
  const res = await withTimeout(fetch(url), TIMEOUT_MS, "health");
  if (!res.ok) {
    warn(`GET ${url} returned ${res.status} - cannot inspect env state`);
    return;
  }
  const json = await res.json();
  const pom = json?.peaceOfMind ?? {};
  for (const [k, v] of Object.entries(pom)) {
    const required = k === "blob";
    if (v) pass(`${k}: set`);
    else if (required) warn(`${k}: UNSET - form will return 503 to every customer until this is configured`);
    else warn(`${k}: unset (optional, degrades gracefully)`);
  }
}

async function check4_validSubmissionResponse() {
  log("4. Valid submission round-trip");
  const url = `${SITE_URL}/api/peace-of-mind/start`;
  const fd = new FormData();
  fd.set("name", "BHTEST smoke");
  fd.set("email", "smoke@example.com");
  fd.set("phone", "0400000000");
  fd.set("address", "Smoke test");
  fd.set("quoteCount", "1");
  // Minimal valid PDF (~400 bytes)
  const pdfBytes = new TextEncoder().encode(
    "%PDF-1.1\n%\xC0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<<>>/Contents 4 0 R>>endobj\n4 0 obj<</Length 20>>stream\nBT /F1 12 Tf ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000054 00000 n\n0000000101 00000 n\n0000000175 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n241\n%%EOF\n",
  );
  fd.set("files", new Blob([pdfBytes], { type: "application/pdf" }), "smoke.pdf");
  const res = await withTimeout(fetch(url, { method: "POST", body: fd }), TIMEOUT_MS, "valid POST");
  const json = await res.json().catch(() => ({}));
  if (res.status === 200) {
    pass(`POST ${url} (valid) -> 200, submissionId=${json.submissionId}`);
  } else if (res.status === 503 && json.code === "blob_not_configured") {
    warn(`POST ${url} (valid) -> 503 blob_not_configured - set BLOB_READ_WRITE_TOKEN in Vercel and redeploy`);
  } else if (res.status >= 500) {
    fail(`POST ${url} (valid) -> ${res.status} - handler crash. Body: ${JSON.stringify(json).slice(0, 200)}`);
  } else {
    warn(`POST ${url} (valid) -> ${res.status}. Body: ${JSON.stringify(json).slice(0, 200)}`);
  }
}

async function main() {
  log(`smoke-peace-of-mind: ${SITE_URL}`);
  log("");
  try {
    await check1_pageReachable();
    await check2_routeAliveValidation();
    await check3_envState();
    await check4_validSubmissionResponse();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
  log("");
  log(`Result: PASS${warnings ? ` with ${warnings} warning(s)` : ""}`);
  process.exit(0);
}

main();
