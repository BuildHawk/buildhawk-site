import { NextResponse } from "next/server";
import { Resend } from "resend";
import { upsertContact, createOpportunity } from "@/lib/ghl";

import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

type IntakePayload = {
  audience?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  projectType?: string;
  stage?: string;
  valueRange?: string;
  message?: string;
};

const audienceLabels: Record<string, string> = {
  builder: "Builder · Hawktress subscription enquiry",
  trade: "Trade · Hawktress subscription enquiry",
  supplier: "Supplier · platform listing enquiry",
  other: "General enquiry",
};

const TO_EMAIL = process.env.INTAKE_TO_EMAIL || "info@buildhawk.com.au";
const FROM_EMAIL =
  process.env.INTAKE_FROM_EMAIL || "BuildHawk Site <onboarding@resend.dev>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(p: IntakePayload): string {
  const audienceLabel =
    (p.audience && audienceLabels[p.audience]) || "General enquiry";
  const rows: [string, string | undefined][] = [
    ["Audience", audienceLabel],
    ["Name", p.name],
    ["Email", p.email],
    ["Phone", p.phone],
    ["Company", p.company],
    ["Role", p.role],
    ["Project type", p.projectType],
    ["Stage", p.stage],
    ["Estimated value", p.valueRange],
  ];
  const tableRows = rows
    .filter(([, v]) => v && v.trim())
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;vertical-align:top;">${escapeHtml(
          k
        )}</td><td style="padding:6px 0;color:#111;font-size:15px;">${escapeHtml(
          v ?? ""
        )}</td></tr>`
    )
    .join("");
  const message = p.message
    ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #d3d6e0;"><p style="margin:0 0 6px;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Project notes</p><p style="margin:0;color:#111;font-size:15px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(
        p.message
      )}</p></div>`
    : "";
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;background:#edeff7;padding:32px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d3d6e0;">
      <div style="background:#111;color:#fff;padding:18px 24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#bcbfcc;">BuildHawk · New brief</p>
        <p style="margin:6px 0 0;font-size:18px;font-weight:600;letter-spacing:-0.01em;">From ${escapeHtml(
          p.name || "Unknown"
        )}</p>
      </div>
      <div style="padding:24px;">
        <table style="border-collapse:collapse;width:100%;">${tableRows}</table>
        ${message}
      </div>
      <div style="background:#de5123;height:6px;"></div>
    </div>
  </body></html>`;
}

function buildText(p: IntakePayload): string {
  const audienceLabel =
    (p.audience && audienceLabels[p.audience]) || "General enquiry";
  const lines: string[] = ["BuildHawk — New brief", ""];
  const rows: [string, string | undefined][] = [
    ["Audience", audienceLabel],
    ["Name", p.name],
    ["Email", p.email],
    ["Phone", p.phone],
    ["Company", p.company],
    ["Role", p.role],
    ["Project type", p.projectType],
    ["Stage", p.stage],
    ["Estimated value", p.valueRange],
  ];
  for (const [k, v] of rows) if (v && v.trim()) lines.push(`${k}: ${v}`);
  if (p.message) {
    lines.push("", "Project notes:", p.message);
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  const _rl = rateLimit(clientIp(req), { bucket: "intake", max: 10 });
  if (!_rl.ok) return tooManyRequests(_rl.retryAfter);

  let body: IntakePayload;
  try {
    body = (await req.json()) as IntakePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Minimal validation
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const projectType = (body.projectType || "").trim();
  const stage = (body.stage || "").trim();

  if (!name || !email || !projectType || !stage) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // GHL: upsert contact + create opportunity for every valid submission
  const contactId = await upsertContact({
    name,
    email,
    phone: body.phone,
    company: body.company,
    source: "buildhawk-site-brief",
    tags: ["website-brief", body.audience ?? "unknown"].filter(Boolean),
  });
  if (contactId) {
    await createOpportunity({
      contactId,
      name: `${name} · ${projectType}`,
      source: "buildhawk-site-brief",
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[intake] RESEND_API_KEY missing. Submission:", body);
    return NextResponse.json(
      {
        error:
          "Email delivery is not configured yet. Please call or email us directly while we finish setup.",
      },
      { status: 503 }
    );
  }

  const resend = new Resend(apiKey);

  const audienceLabel =
    (body.audience && audienceLabels[body.audience]) || "General";
  const { error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [TO_EMAIL],
    replyTo: email,
    subject: `[${audienceLabel}] ${name} · ${projectType}`,
    html: buildHtml(body),
    text: buildText(body),
  });

  if (sendError) {
    console.error("[intake] Resend send failed:", sendError);
    return NextResponse.json(
      { error: "Could not send right now. Please email info@buildhawk.com.au" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
