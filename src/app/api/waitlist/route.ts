import { NextResponse } from "next/server";
import { Resend } from "resend";
import { upsertContact, createOpportunity } from "@/lib/ghl";

import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

type WaitlistPayload = {
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  audience?: "builder" | "trade" | "supplier" | "owner-builder" | "other";
  notes?: string;
};

const audienceLabels: Record<string, string> = {
  builder: "Builder",
  trade: "Trade",
  supplier: "Supplier",
  "owner-builder": "Owner-builder",
  other: "Other",
};

const TO_EMAIL = process.env.WAITLIST_TO_EMAIL || process.env.INTAKE_TO_EMAIL || "info@buildhawk.com.au";
const FROM_EMAIL =
  process.env.WAITLIST_FROM_EMAIL || process.env.INTAKE_FROM_EMAIL || "BuildHawk Waitlist <onboarding@resend.dev>";

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

export async function POST(req: Request) {
  const _rl = rateLimit(clientIp(req), { bucket: "waitlist", max: 10 });
  if (!_rl.ok) return tooManyRequests(_rl.retryAfter);

  let payload: WaitlistPayload;
  try {
    payload = (await req.json()) as WaitlistPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (payload.email || "").trim();
  const name = (payload.name || "").trim();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ ok: false, error: "Name required" }, { status: 400 });
  }

  const audienceLabel =
    (payload.audience && audienceLabels[payload.audience]) || "Unspecified";

  const rows: [string, string | undefined][] = [
    ["Audience", audienceLabel],
    ["Name", name],
    ["Email", email],
    ["Company", payload.company],
    ["Role", payload.role],
  ];

  const rowsHtml = rows
    .filter(([, v]) => v && String(v).length)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;vertical-align:top;">${escapeHtml(
          k
        )}</td><td style="padding:6px 0;color:#111;font-size:15px;">${escapeHtml(
          String(v)
        )}</td></tr>`
    )
    .join("");

  const notesBlock = payload.notes
    ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #d3d6e0;"><p style="margin:0 0 6px;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Notes</p><p style="margin:0;color:#111;font-size:15px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(
        payload.notes
      )}</p></div>`
    : "";

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#edeff7;font-family:Inter,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #d3d6e0;">
      <div style="background:#111;color:#fff;padding:18px 24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#bcbfcc;">BuildHawk · Waitlist</p>
        <p style="margin:6px 0 0;font-size:18px;letter-spacing:-0.01em;">New waitlist signup · ${escapeHtml(audienceLabel)}</p>
      </div>
      <div style="padding:20px 24px;">
        <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
        ${notesBlock}
      </div>
    </div>
  </body></html>`;

  // GHL: upsert contact + create opportunity for every valid waitlist signup
  const contactId = await upsertContact({
    name,
    email,
    company: payload.company,
    source: "buildhawk-site-waitlist",
    tags: ["website-waitlist", payload.audience ?? "unknown"].filter(Boolean),
  });
  if (contactId) {
    await createOpportunity({
      contactId,
      name: `${name} · Hawktress waitlist`,
      source: "buildhawk-site-waitlist",
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Without an API key configured, accept the signup but log only — keeps preview/dev usable.
    console.log("[waitlist] (no RESEND_API_KEY) signup:", { audienceLabel, name, email, company: payload.company, role: payload.role });
    return NextResponse.json({ ok: true, queued: false });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `Waitlist · ${audienceLabel} · ${name}`,
      html,
    });
    return NextResponse.json({ ok: true, queued: true });
  } catch (err) {
    console.error("[waitlist] resend error:", err);
    return NextResponse.json({ ok: false, error: "Send failed" }, { status: 502 });
  }
}
