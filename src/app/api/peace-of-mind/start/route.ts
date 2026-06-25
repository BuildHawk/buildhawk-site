import { NextResponse } from "next/server";
import { Resend } from "resend";
import { put } from "@vercel/blob";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { signFileToken } from "@/lib/peace-of-mind/file-tokens";
import {
  isPeaceOfMindPayFirstEnabled,
  verifyPaidSession,
} from "@/lib/peace-of-mind/stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

const TO_EMAIL =
  process.env.PEACE_OF_MIND_TO_EMAIL ||
  process.env.LEAD_TO_EMAIL ||
  process.env.INTAKE_TO_EMAIL ||
  "info@buildhawk.com.au";
const FROM_EMAIL =
  process.env.PEACE_OF_MIND_FROM_EMAIL ||
  process.env.LEAD_FROM_EMAIL ||
  process.env.INTAKE_FROM_EMAIL ||
  "BuildHawk Peace of Mind <onboarding@resend.dev>";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://www.buildhawk.com.au");

const MAX_PER_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXT = new Set([
  "pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx",
]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

// Signed file links live 7 days (long enough for ops to action, short enough to limit leak blast radius).
const FILE_LINK_TTL_SECONDS = 7 * 24 * 60 * 60;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function safeFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 180) || "file";
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function todayPath(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function randomId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

type ParsedForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  quoteCount: string;
  builders: string;
  notes: string;
  files: File[];
  honeypot: string;
};

function parseString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  const _rl = rateLimit(clientIp(req), { bucket: "peace-of-mind", max: 10 });
  if (!_rl.ok) return tooManyRequests(_rl.retryAfter);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not read form. Please try again." },
      { status: 400 },
    );
  }

  const parsed: ParsedForm = {
    name: parseString(form.get("name")),
    email: parseString(form.get("email")),
    phone: parseString(form.get("phone")),
    address: parseString(form.get("address")),
    quoteCount: parseString(form.get("quoteCount")),
    builders: parseString(form.get("builders")),
    notes: parseString(form.get("notes")),
    files: form
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0),
    // Honeypot field. Real browsers never fill this (it's display:none).
    // Bots that walk the DOM and fill every input will trip it.
    honeypot: parseString(form.get("website")),
  };

  // Honeypot: silently 200 to avoid teaching the bot what tripped it.
  if (parsed.honeypot) {
    console.warn("[peace-of-mind] honeypot tripped, ignoring submission", {
      ip: clientIp(req),
      ua: req.headers.get("user-agent")?.slice(0, 80),
    });
    return NextResponse.json({ ok: true, submissionId: "ignored", fileCount: 0 });
  }

  // -------------------------------------------------------------------------
  // Pay-first mode (PEACE_OF_MIND_PRICE_ID set): a verified-paid Stripe
  // session is required, and contact details come from the session metadata
  // rather than the form payload (so a forged session_id can't smuggle in
  // arbitrary lead details). The success-page upload UI POSTs session_id.
  // -------------------------------------------------------------------------
  const payFirst = isPeaceOfMindPayFirstEnabled();
  if (payFirst) {
    const sessionId = parseString(form.get("session_id"));
    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Payment required. Please pay before uploading." },
        { status: 402 },
      );
    }
    const verified = await verifyPaidSession(sessionId);
    if (!verified || verified.paymentStatus !== "paid") {
      return NextResponse.json(
        { ok: false, error: "We could not verify your payment. Please try again or contact us." },
        { status: 402 },
      );
    }
    // Trust the Stripe-side data, not the form payload.
    parsed.name = verified.form.name || parsed.name;
    parsed.email = verified.form.email || parsed.email;
    parsed.phone = verified.form.phone || parsed.phone;
    parsed.address = verified.form.address || parsed.address;
    parsed.quoteCount = verified.form.quoteCount || parsed.quoteCount;
    parsed.builders = verified.form.builders || parsed.builders;
    parsed.notes = verified.form.notes || parsed.notes;
  }

  // -------------------------------------------------------------------------
  // Validation: files FIRST (cheaper reject for the dominant failure mode -
  // wrong file type or no file - and avoids parsing text validation
  // every time someone drops the wrong thing).
  // -------------------------------------------------------------------------
  if (parsed.files.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Attach at least one quote, plan or spec file." },
      { status: 400 },
    );
  }
  let totalBytes = 0;
  for (const f of parsed.files) {
    if (f.size > MAX_PER_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `"${f.name}" is over the 25 MB per-file limit.` },
        { status: 400 },
      );
    }
    const ext = extOf(f.name);
    const typeOk = ALLOWED_MIME.has(f.type) || ALLOWED_EXT.has(ext);
    if (!typeOk) {
      return NextResponse.json(
        {
          ok: false,
          error: `"${f.name}" is not a supported file type. Accepted: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX.`,
        },
        { status: 400 },
      );
    }
    totalBytes += f.size;
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Total upload size is over the 100 MB limit." },
      { status: 400 },
    );
  }

  // Text-field validation
  if (!parsed.name) {
    return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  }
  if (!parsed.email || !isValidEmail(parsed.email)) {
    return NextResponse.json(
      { ok: false, error: "A valid email is required." },
      { status: 400 },
    );
  }
  if (!parsed.phone) {
    return NextResponse.json({ ok: false, error: "Phone is required." }, { status: 400 });
  }
  if (!parsed.address) {
    return NextResponse.json(
      { ok: false, error: "Project address or suburb is required." },
      { status: 400 },
    );
  }
  if (!["1", "2", "3"].includes(parsed.quoteCount)) {
    return NextResponse.json(
      { ok: false, error: "Select how many quotes you'd like reviewed (1, 2 or 3)." },
      { status: 400 },
    );
  }

  // -------------------------------------------------------------------------
  // Blob upload (hard fail - no point continuing without files stored).
  // -------------------------------------------------------------------------
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    console.error(
      "[peace-of-mind] BLOB_READ_WRITE_TOKEN missing - refusing submission.",
    );
    return NextResponse.json(
      {
        ok: false,
        error:
          "Uploads are not configured yet. Please email info@buildhawk.com.au while we finish setup.",
        // Hint for the form to render the fallback state cleanly.
        code: "blob_not_configured",
      },
      { status: 503 },
    );
  }

  const submissionId = randomId();
  const datePath = todayPath();
  type Uploaded = {
    name: string;
    size: number;
    contentType: string;
    url: string; // Raw Blob URL (random-suffix, hard to guess, but technically public).
    signedUrl: string; // Token-gated download URL we put in emails.
    bytes: ArrayBuffer;
    pathname: string;
  };
  const uploaded: Uploaded[] = [];
  try {
    for (const f of parsed.files) {
      const bytes = await f.arrayBuffer();
      const safeName = safeFilename(f.name);
      const key = `peace-of-mind/${datePath}/${submissionId}/${safeName}`;
      const result = await put(key, bytes, {
        access: "public",
        token: blobToken,
        contentType: f.type || "application/octet-stream",
        // addRandomSuffix: true means the URL is practically un-enumerable
        // even if the path scheme leaks. Defence-in-depth alongside the
        // signed-URL proxy.
        addRandomSuffix: true,
        allowOverwrite: false,
      });
      const signedUrl = await buildSignedFileUrl(result.pathname, f.name);
      uploaded.push({
        name: f.name,
        size: f.size,
        contentType: f.type || "application/octet-stream",
        url: result.url,
        signedUrl,
        bytes,
        pathname: result.pathname,
      });
    }
  } catch (err) {
    console.error("[peace-of-mind] Blob upload failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "We couldn't store your files. Please try again in a minute.",
      },
      { status: 502 },
    );
  }

  // -------------------------------------------------------------------------
  // Ops email + customer confirmation + GHL writes in parallel.
  // All best-effort: user gets a 200 as long as files are stored.
  // -------------------------------------------------------------------------
  const subject = `Peace of Mind: ${parsed.name} (${parsed.quoteCount} quote${parsed.quoteCount === "1" ? "" : "s"})`;

  const [opsResult, ackResult, webhookResult] = await Promise.allSettled([
  sendOpsEmail({ parsed, uploaded, subject, submissionId }),
  sendCustomerAck({ parsed, uploaded, submissionId }),
  fetch(
    "https://buildhawk.app.n8n.cloud/webhook/buildhawk-peace-of-mind-save-ghl",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        address: parsed.address,
        quoteCount: parsed.quoteCount,
        builders: parsed.builders,
        notes: parsed.notes,

        files: uploaded.map(file => ({
          name: file.name,
          url: file.signedUrl || file.url,
          size: file.size,
        })),
      }),
    }
  ),
]);

  if (opsResult.status === "rejected") {
    console.error("[peace-of-mind] ops email failed:", opsResult.reason);
  }
  if (ackResult.status === "rejected") {
    console.error("[peace-of-mind] customer ack email failed:", ackResult.reason);
  }
  if (webhookResult.status === "rejected") {
  console.error(
    "[peace-of-mind] n8n webhook failed:",
    webhookResult.reason,
  );
}

  return NextResponse.json({
    ok: true,
    submissionId,
    fileCount: uploaded.length,
  });
}

async function buildSignedFileUrl(pathname: string, downloadName: string): Promise<string> {
  const token = await signFileToken({
    pathname,
    name: downloadName,
    ttlSeconds: FILE_LINK_TTL_SECONDS,
  });
  if (!token) return ""; // Caller falls back if signing isn't configured.
  return `${SITE_URL}/api/peace-of-mind/file?t=${encodeURIComponent(token)}`;
}

async function sendOpsEmail(args: {
  parsed: ParsedForm;
  uploaded: { name: string; size: number; signedUrl: string; url: string }[];
  subject: string;
  submissionId: string;
}): Promise<void> {
  const { parsed, uploaded, subject, submissionId } = args;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[peace-of-mind] RESEND_API_KEY missing - logging submission only:",
      {
        submissionId,
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        address: parsed.address,
        quoteCount: parsed.quoteCount,
        builders: parsed.builders,
        files: uploaded.map((u) => u.url),
      },
    );
    return;
  }

  const rows: [string, string | undefined][] = [
    ["Name", parsed.name],
    ["Email", parsed.email],
    ["Phone", parsed.phone],
    ["Project address", parsed.address],
    ["Quotes to review", parsed.quoteCount],
    ["Builder names", parsed.builders || undefined],
    ["Notes", parsed.notes || undefined],
    ["Submission ID", submissionId],
  ];
  const rowsHtml = rows
    .filter(([, v]) => v && String(v).length)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:6px 0;color:#111;font-size:15px;white-space:pre-wrap;">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  const filesHtml = uploaded
    .map((u) => {
      const href = u.signedUrl || u.url;
      return `<li style="margin:4px 0;font-size:14px;line-height:1.45;"><a href="${escapeHtml(href)}" style="color:#de5123;text-decoration:underline;">${escapeHtml(u.name)}</a> <span style="color:#6e7180;">(${escapeHtml(fmtBytes(u.size))})</span></li>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#edeff7;font-family:Inter,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:24px auto;background:#fff;border:1px solid #d3d6e0;">
      <div style="background:#111;color:#fff;padding:18px 24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#bcbfcc;">BuildHawk · Peace of Mind</p>
        <p style="margin:6px 0 0;font-size:18px;letter-spacing:-0.01em;">${escapeHtml(parsed.name)} · ${escapeHtml(parsed.quoteCount)} quote${parsed.quoteCount === "1" ? "" : "s"}</p>
      </div>
      <div style="padding:20px 24px;">
        <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #d3d6e0;">
          <p style="margin:0 0 8px;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Attached files (${uploaded.length})</p>
          <ul style="margin:0;padding-left:20px;color:#111;">${filesHtml}</ul>
          <p style="margin:14px 0 0;color:#6e7180;font-size:11px;line-height:1.5;">File links expire in 7 days. They are token-gated; do not forward externally.</p>
        </div>
      </div>
      <div style="background:#de5123;height:6px;"></div>
    </div>
  </body></html>`;

  const text = [
    `BuildHawk Peace of Mind submission`,
    ``,
    `Submission ID: ${submissionId}`,
    `Name: ${parsed.name}`,
    `Email: ${parsed.email}`,
    `Phone: ${parsed.phone}`,
    `Project address: ${parsed.address}`,
    `Quotes to review: ${parsed.quoteCount}`,
    parsed.builders ? `Builders: ${parsed.builders}` : null,
    parsed.notes ? `Notes:\n${parsed.notes}` : null,
    ``,
    `Files (${uploaded.length}) - token-gated, expire in 7 days:`,
    ...uploaded.map((u) => `  - ${u.name} (${fmtBytes(u.size)}) ${u.signedUrl || u.url}`),
  ]
    .filter(Boolean)
    .join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: parsed.email,
    subject,
    html,
    text,
  });
  if (error) {
    throw new Error(`Resend ops email error: ${JSON.stringify(error)}`);
  }
}

async function sendCustomerAck(args: {
  parsed: ParsedForm;
  uploaded: { name: string }[];
  submissionId: string;
}): Promise<void> {
  const { parsed, uploaded, submissionId } = args;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const fileList = uploaded.map((u) => `  - ${u.name}`).join("\n");
  const subject = `We've got your quotes, ${parsed.name.split(" ")[0] || "there"}`;

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#edeff7;font-family:Inter,Helvetica,Arial,sans-serif;color:#111;">
    <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #d3d6e0;">
      <div style="background:#111;color:#fff;padding:18px 24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#bcbfcc;">BuildHawk · Peace of Mind</p>
        <p style="margin:6px 0 0;font-size:18px;letter-spacing:-0.01em;">We've got your quotes</p>
      </div>
      <div style="padding:24px;font-size:15px;line-height:1.55;">
        <p style="margin:0 0 14px;">Hi ${escapeHtml(parsed.name.split(" ")[0] || "there")},</p>
        <p style="margin:0 0 14px;">Thanks for sending your ${escapeHtml(parsed.quoteCount)} quote${parsed.quoteCount === "1" ? "" : "s"} through for review. We've received them safely and we'll be in touch within one business day to confirm the details and arrange payment ($499 + GST) before we get started.</p>
        <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#6e7180;">Files received (${uploaded.length})</p>
        <ul style="margin:0 0 18px;padding-left:20px;">
          ${uploaded.map((u) => `<li>${escapeHtml(u.name)}</li>`).join("")}
        </ul>
        <p style="margin:0 0 14px;">If you don't hear from us, please check your spam folder or reply to this email.</p>
        <p style="margin:18px 0 0;color:#6e7180;font-size:13px;">Reference: ${escapeHtml(submissionId)}</p>
      </div>
      <div style="background:#de5123;height:6px;"></div>
    </div>
  </body></html>`;

  const text = [
    `Hi ${parsed.name.split(" ")[0] || "there"},`,
    ``,
    `Thanks for sending your ${parsed.quoteCount} quote${parsed.quoteCount === "1" ? "" : "s"} through for review. We've received them safely and we'll be in touch within one business day to confirm the details and arrange payment ($499 + GST) before we get started.`,
    ``,
    `Files received (${uploaded.length}):`,
    fileList,
    ``,
    `If you don't hear from us, please check your spam folder or reply to this email.`,
    ``,
    `Reference: ${submissionId}`,
    `BuildHawk Peace of Mind`,
  ].join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: parsed.email,
    replyTo: TO_EMAIL,
    subject,
    html,
    text,
  });
  if (error) {
    throw new Error(`Resend customer ack error: ${JSON.stringify(error)}`);
  }
}
