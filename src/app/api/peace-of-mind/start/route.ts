import { NextResponse } from "next/server";
import { Resend } from "resend";
import { put } from "@vercel/blob";
import {
  upsertContact,
  createOpportunity,
  uploadFileToGhlMediaLibrary,
} from "@/lib/ghl";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
// Allow larger payloads since this route accepts uploads (cap enforced below).
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

const MAX_PER_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_EXT = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
  "xls",
  "xlsx",
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
  // Crypto-strength random id without pulling a dep.
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
};

function parseString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  const _rl = rateLimit(clientIp(req), { bucket: "peace-of-mind", max: 10 });
  if (!_rl.ok) return tooManyRequests(_rl.retryAfter);

  // Parse multipart/form-data
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
  };

  // Validation
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
  if (parsed.files.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Attach at least one quote, plan or spec file." },
      { status: 400 },
    );
  }

  // File validation
  let totalBytes = 0;
  for (const f of parsed.files) {
    if (f.size > MAX_PER_FILE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: `"${f.name}" is over the 25 MB per-file limit.`,
        },
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

  // -------------------------------------------------------------------------
  // Step 1: Vercel Blob upload (HARD fail - no point continuing without files).
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
    url: string;
    bytes: ArrayBuffer;
  };
  const uploaded: Uploaded[] = [];
  try {
    for (const f of parsed.files) {
      const bytes = await f.arrayBuffer();
      const key = `peace-of-mind/${datePath}/${submissionId}/${safeFilename(f.name)}`;
      const result = await put(key, bytes, {
        access: "public",
        token: blobToken,
        contentType: f.type || "application/octet-stream",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      uploaded.push({
        name: f.name,
        size: f.size,
        contentType: f.type || "application/octet-stream",
        url: result.url,
        bytes,
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
  // Steps 2 + 3: Resend email + GHL (contact, opportunity, file attach) in
  // parallel. Both are tolerant of failure - the user still gets a 200.
  // -------------------------------------------------------------------------
  const subject = `Peace of Mind: ${parsed.name} - ${parsed.quoteCount} quote${parsed.quoteCount === "1" ? "" : "s"}`;
  // ^ note: unicode em dash is allowed in machine-only subject for ops; user-facing UI copy has none.

  const emailPromise = sendOpsEmail({
    parsed,
    uploaded,
    subject,
  });

  const ghlPromise = pushToGhl({
    parsed,
    uploaded,
  });

  const [emailResult, ghlResult] = await Promise.allSettled([
    emailPromise,
    ghlPromise,
  ]);

  if (emailResult.status === "rejected") {
    console.error("[peace-of-mind] ops email failed:", emailResult.reason);
  }
  if (ghlResult.status === "rejected") {
    console.error("[peace-of-mind] GHL push failed:", ghlResult.reason);
  }

  return NextResponse.json({
    ok: true,
    submissionId,
    fileCount: uploaded.length,
  });
}

async function sendOpsEmail(args: {
  parsed: ParsedForm;
  uploaded: { name: string; size: number; url: string }[];
  subject: string;
}): Promise<void> {
  const { parsed, uploaded, subject } = args;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[peace-of-mind] RESEND_API_KEY missing - logging submission only:",
      {
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
  ];
  const rowsHtml = rows
    .filter(([, v]) => v && String(v).length)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;vertical-align:top;">${escapeHtml(
          k,
        )}</td><td style="padding:6px 0;color:#111;font-size:15px;white-space:pre-wrap;">${escapeHtml(
          String(v),
        )}</td></tr>`,
    )
    .join("");

  const filesHtml = uploaded
    .map(
      (u) =>
        `<li style="margin:4px 0;font-size:14px;line-height:1.45;"><a href="${escapeHtml(
          u.url,
        )}" style="color:#de5123;text-decoration:underline;">${escapeHtml(
          u.name,
        )}</a> <span style="color:#6e7180;">(${escapeHtml(fmtBytes(u.size))})</span></li>`,
    )
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
        </div>
      </div>
      <div style="background:#de5123;height:6px;"></div>
    </div>
  </body></html>`;

  const text =
    [
      `BuildHawk Peace of Mind submission`,
      ``,
      `Name: ${parsed.name}`,
      `Email: ${parsed.email}`,
      `Phone: ${parsed.phone}`,
      `Project address: ${parsed.address}`,
      `Quotes to review: ${parsed.quoteCount}`,
      parsed.builders ? `Builders: ${parsed.builders}` : null,
      parsed.notes ? `Notes:\n${parsed.notes}` : null,
      ``,
      `Files (${uploaded.length}):`,
      ...uploaded.map((u) => `  - ${u.name} (${fmtBytes(u.size)}) ${u.url}`),
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
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

async function pushToGhl(args: {
  parsed: ParsedForm;
  uploaded: { name: string; contentType: string; bytes: ArrayBuffer }[];
}): Promise<void> {
  const { parsed, uploaded } = args;
  const contactId = await upsertContact({
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone,
    source: "buildhawk-site-peace-of-mind",
    tags: ["website-peace-of-mind", `quotes-${parsed.quoteCount}`],
  });
  if (!contactId) {
    console.warn("[peace-of-mind] GHL upsertContact returned no id; skipping the rest.");
    return;
  }
  await createOpportunity({
    contactId,
    name: `${parsed.name} · Peace of Mind (${parsed.quoteCount} quote${parsed.quoteCount === "1" ? "" : "s"})`,
    source: "buildhawk-site-peace-of-mind",
  });

  // File attach is best-effort; uploadFileToGhlMediaLibrary already swallows
  // and logs failures internally.
  for (const u of uploaded) {
    const ok = await uploadFileToGhlMediaLibrary({
      fileName: u.name,
      fileBytes: u.bytes,
      contentType: u.contentType,
    });
    if (!ok) {
      console.warn(
        `[peace-of-mind] GHL media upload skipped for "${u.name}" - file still in Blob and emailed to ops.`,
      );
    }
  }
}
