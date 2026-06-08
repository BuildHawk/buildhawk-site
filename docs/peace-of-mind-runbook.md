# Peace of Mind: Operational Runbook

Audience: BuildHawk ops + on-call. Covers the `/peace-of-mind` quote-review form, its API, where data lands, how to verify it's working, and what to do when something breaks.

Last reviewed: 8 June 2026 (PR opening the pay-first + hardening pass).

---

## 1. What this product is

A homeowner buys an independent review of their builder quotes for `$499 + GST`. The customer-facing flow is:

1. Land on https://www.buildhawk.com.au/peace-of-mind
2. Fill the in-page form (contact details + project address + number of quotes + notes)
3. Upload PDFs / images of their builder quotes
4. Submit. We acknowledge by email and confirm by phone within 1 business day.
5. We deliver a written report within 5 business days.

Two operational modes exist behind one env-var switch:

| Mode | Trigger | Customer flow |
|---|---|---|
| **Files-first (current default)** | `PEACE_OF_MIND_PRICE_ID` unset | Form collects details + files together. Payment is arranged manually by ops after confirmation. |
| **Pay-first** | `PEACE_OF_MIND_PRICE_ID` set to a Stripe Price ID | Form collects details only, redirects to Stripe Checkout, then `/peace-of-mind/success` shows the upload form. |

---

## 2. Where the data lands

Every successful submission writes to **three** places:

| Destination | What | How to find it |
|---|---|---|
| **Vercel Blob** | The uploaded quote files | Vercel dashboard → Project → Storage → Blob → browse `peace-of-mind/<yyyy-mm-dd>/<submission-id>/...` |
| **Resend email to `info@buildhawk.com.au`** | A formatted notification with all form fields + token-gated download links | Subject: `Peace of Mind: <Name> (<N> quotes)`. `replyTo` is the customer's email. |
| **GoHighLevel BuildHawk location** (`sJHr1joAOg5ZYB2XxOTD`) | A contact + opportunity in Lead Qualification Pipeline / New Lead stage, tagged `website-peace-of-mind` and `quotes-N`. Best-effort file attach to Media Library. | https://app.gohighlevel.com/v2/location/sJHr1joAOg5ZYB2XxOTD/ |

The customer also receives a confirmation email from `hello@buildhawk.com.au` with subject `We've got your quotes, <FirstName>`.

---

## 3. Required environment variables

Set in Vercel → Project → Settings → Environment Variables (Production).

| Var | Required for | What happens without it |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Form uploads | Form returns 503; page renders an "email us instead" fallback. **The single most important var.** Set this by connecting a Blob store in Vercel UI — token is auto-injected. |
| `RESEND_API_KEY` | Ops + customer emails | Submission succeeds, but no email goes out. Server logs the submission. |
| `GHL_API_KEY` + `GHL_LOCATION_ID` + `GHL_PIPELINE_ID` + `GHL_STAGE_ID` | CRM lead capture + file attach | Submission succeeds, but nothing reaches GHL. Defaults baked into code point at the BuildHawk location, so just `GHL_API_KEY` is the practical minimum. |
| `BH_AUTH_SECRET` | Signed download URLs in ops emails | Download links fall back to raw Blob URLs (un-guessable but technically public-read). Already set for the Command Centre auth gate. |
| `PEACE_OF_MIND_PRICE_ID` | Pay-first mode | Form stays in files-first mode (ops handles payment manually). |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Pay-first mode | Pay-first stays disabled even if `PEACE_OF_MIND_PRICE_ID` is set. |

Optional overrides:
- `PEACE_OF_MIND_TO_EMAIL` (default `info@buildhawk.com.au`)
- `PEACE_OF_MIND_FROM_EMAIL` (default `BuildHawk Peace of Mind <hello@buildhawk.com.au>`)

---

## 4. How to verify it's working (5 minutes)

### 4a. Health endpoint

```
curl -s https://www.buildhawk.com.au/api/health | jq .peaceOfMind
```

Expected (post go-live):
```json
{ "blob": true, "resend": true, "ghl": true, "stripePrice": false }
```

(`stripePrice: false` is normal if pay-first isn't enabled.)

### 4b. Smoke test (the canned script)

```
node scripts/smoke-peace-of-mind.mjs
```

Checks: page reachable, route alive, env state visible, valid POST round-trips.

Exits 0 on success, 1 on a real deploy break. Env state issues are reported as warnings, not failures.

### 4c. Manual end-to-end

1. Open https://www.buildhawk.com.au/peace-of-mind#start
2. Fill the form (use `bhtest@example.com`-style label so it's findable later)
3. Upload one small PDF
4. Submit
5. Confirm:
   - In-page success state appears
   - Email arrives in `info@buildhawk.com.au` within ~10s
   - Customer ack email arrives at the test address
   - Contact appears in GHL BuildHawk under Lead Qualification Pipeline / New Lead, tagged `website-peace-of-mind`
   - File appears in Vercel Blob under today's date
6. Delete the test contact/opportunity in GHL afterward

---

## 5. Spam protection

- **Honeypot field**: a hidden `website` input. Real users never fill it; bots that walk the DOM and fill every input get silently 200'd (server logs `[peace-of-mind] honeypot tripped`).
- **Rate limit**: 10 submissions per 15 min per IP. Same bucket as `intake` / `lead` / `waitlist`.
- **File validation**: extensions and MIME types are checked server-side. Random extensions or executables are rejected with `"<filename>" is not a supported file type.`

If spam volume grows past what the honeypot catches, add Cloudflare Turnstile or hCaptcha as a follow-up.

---

## 6. Common issues and how to fix

### "Uploads are not configured yet" appears to every customer
`BLOB_READ_WRITE_TOKEN` is unset in Vercel.
**Fix:** Vercel → Storage → Connect Blob store → Redeploy.

### Ops email never arrives
`RESEND_API_KEY` unset, or the email is going to spam.
**Check:** `/api/health` `.peaceOfMind.resend`. If `false`, set the key. If `true`, check Resend dashboard for delivery + bounce status.

### Submission succeeds but no GHL contact
`GHL_API_KEY` unset OR the integration token's scopes don't include `contacts.write` / `opportunities.write`.
**Check:** Vercel logs for `[ghl] upsertContact failed:` lines. If the token is bad, regenerate the Private Integration in GHL (BuildHawk location → Settings → Private Integrations) and update the env var.

### File appears in Blob + email but not in GHL Media Library
Expected best-effort behaviour. Server logs `[peace-of-mind] GHL media upload skipped`. The integration token may not have `medias.write` scope. Add the scope in GHL Private Integration settings, OR ignore — the file is still in Blob and ops has the download link.

### Download link in ops email returns "Link invalid or expired"
Links expire 7 days after the submission. If you still need the file, find it in Vercel Blob under the dated path and download manually.

### Form submit returns "Payment required" (HTTP 402)
Pay-first mode is on (`PEACE_OF_MIND_PRICE_ID` set) and a customer is hitting the upload endpoint without paying. Most likely the success page wasn't reached. Check Stripe Dashboard for an abandoned session for that email.

### Honeypot is tripping real submissions
Extremely unlikely (the field is `display: none` + `aria-hidden` + `tabIndex=-1` + `autocomplete=off`). If you see legitimate ones in the logs, a browser extension auto-filling forms is the cause. Tell the customer to disable form autofill and resubmit, or take the details by phone.

---

## 7. Pay-first activation checklist

When ready to turn on Stripe checkout:

1. **In Stripe Dashboard** (the entity that should receive the funds):
   - Create Product: "Peace of Mind quote review"
   - Create Price: `$499 AUD`, one-off (`mode: payment`)
   - Decide on GST: turn on Stripe Tax (auto-calc, requires GST-registered entity), OR include GST in the price as a single line
   - Decide on refund policy and add a customer-facing line to the success page (currently uses default copy)
2. **In Vercel**:
   - Set `PEACE_OF_MIND_PRICE_ID=price_xxxxx`
   - Confirm `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are live keys (not test)
3. **Redeploy**. The `/peace-of-mind` form switches automatically.
4. **Smoke test**: do one real $499 purchase end-to-end, then refund yourself in Stripe Dashboard.

To roll back: unset `PEACE_OF_MIND_PRICE_ID` and redeploy. Files-first flow returns; existing Stripe sessions in-flight are unaffected.

---

## 8. Escalation

| Severity | Trigger | What to do |
|---|---|---|
| **Sev 1** | Form returns 5xx to every customer | Check Vercel deploy logs, roll back to previous deploy via Vercel UI, notify John |
| **Sev 2** | Submissions land in Blob but ops email + GHL both fail | Likely Resend key rotated. Check `/api/health`, regenerate keys. Submissions are still recoverable from Blob. |
| **Sev 3** | One submission failed but others work | Check Vercel runtime logs for that submission ID. Most likely a one-off network blip. |
| **Sev 4** | Spam volume above 5/day getting through the honeypot | Add Turnstile/hCaptcha as a follow-up PR |

---

## 9. Code map (for engineers)

| File | Role |
|---|---|
| `src/app/peace-of-mind/page.tsx` | Public marketing + form section. Picks pay-first vs files-first based on env. |
| `src/app/peace-of-mind/StartForm.tsx` | The customer-facing form. Branches on `payFirst` prop. |
| `src/app/peace-of-mind/success/page.tsx` | Post-Stripe-payment landing. Verifies session, renders upload form. |
| `src/app/peace-of-mind/success/SuccessUploadForm.tsx` | The upload form rendered on the success page (paid users only). |
| `src/app/api/peace-of-mind/start/route.ts` | Multipart handler: validates, uploads to Blob, fires ops email + customer ack + GHL writes. |
| `src/app/api/peace-of-mind/checkout/route.ts` | Creates a Stripe Checkout session for pay-first. |
| `src/app/api/peace-of-mind/file/route.ts` | Token-gated download proxy for files in the ops email. |
| `src/lib/peace-of-mind/stripe.ts` | Stripe helpers: checkout creation + session verification. |
| `src/lib/peace-of-mind/file-tokens.ts` | HMAC-signed short-lived tokens for the file proxy. |
| `src/lib/ghl.ts` | Existing GHL helpers + `uploadFileToGhlMediaLibrary`. |
| `src/app/api/health/route.ts` | Health endpoint, reports `peaceOfMind` env-var state. |
| `scripts/smoke-peace-of-mind.mjs` | Post-deploy smoke test. |
