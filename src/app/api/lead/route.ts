import { NextResponse } from "next/server";
import { Resend } from "resend";
import { upsertContact, createOpportunity } from "@/lib/ghl";

import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

type LeadPayload = {
  name?: string;
  email?: string;
  phone?: string;
  audience?: string;
  project?: string;
  region?: string;
  timeline?: string;
  notes?: string;
  transcript?: { role: "user" | "assistant"; content: string }[];
  source?: string;
};

const TO_EMAIL =
  process.env.LEAD_TO_EMAIL ||
  process.env.WAITLIST_TO_EMAIL ||
  process.env.INTAKE_TO_EMAIL ||
  "services@buildhawk.com.au";
const FROM_EMAIL =
  process.env.LEAD_FROM_EMAIL ||
  process.env.WAITLIST_FROM_EMAIL ||
  process.env.INTAKE_FROM_EMAIL ||
  "BuildHawk Live Chat <onboarding@resend.dev>";

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
  const _rl = rateLimit(clientIp(req), { bucket: "lead", max: 10 });
  if (!_rl.ok) return tooManyRequests(_rl.retryAfter);

  let payload: LeadPayload;
  try {
    payload = (await req.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const name = (payload.name || "").trim();
  const email = (payload.email || "").trim();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ ok: false, error: "Name required" }, { status: 400 });
  }

  const rows: [string, string | undefined][] = [
    ["Source", payload.source || "Live chat widget"],
    ["Audience", payload.audience],
    ["Name", name],
    ["Email", email],
    ["Phone", payload.phone],
    ["Project", payload.project],
    ["Region", payload.region],
    ["Timeline", payload.timeline],
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

  const transcript = (payload.transcript || []).slice(-30);
  const transcriptHtml = transcript.length
    ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #d3d6e0;"><p style="margin:0 0 12px;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Transcript</p>${transcript
        .map(
          (m) =>
            `<p style="margin:6px 0;color:${
              m.role === "user" ? "#111" : "#6e7180"
            };font-size:14px;line-height:1.5;"><strong>${
              m.role === "user" ? "Visitor" : "Intake"
            }:</strong> ${escapeHtml(m.content)}</p>`
        )
        .join("")}</div>`
    : "";

  const notesHtml = payload.notes
    ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #d3d6e0;"><p style="margin:0 0 6px;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Notes</p><p style="margin:0;color:#111;font-size:15px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(
        payload.notes
      )}</p></div>`
    : "";

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#edeff7;font-family:Inter,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #d3d6e0;">
      <div style="background:#111;color:#fff;padding:18px 24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#bcbfcc;">BuildHawk · Live chat lead</p>
        <p style="margin:6px 0 0;font-size:18px;letter-spacing:-0.01em;">${escapeHtml(name)}</p>
      </div>
      <div style="padding:20px 24px;">
        <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
        ${notesHtml}
        ${transcriptHtml}
      </div>
    </div>
  </body></html>`;

  // GHL: upsert contact + create opportunity for every valid lead
  const contactId = await upsertContact({
    name,
    email,
    phone: payload.phone,
    source: "buildhawk-site-chat",
    tags: ["website-chat", payload.audience ?? "unknown"].filter(Boolean),
  });
  if (contactId) {
    await createOpportunity({
      contactId,
      name: `${name} · chat lead`,
      source: "buildhawk-site-chat",
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[lead] (no RESEND_API_KEY) chat lead:", { name, email, phone: payload.phone, audience: payload.audience, project: payload.project, region: payload.region, timeline: payload.timeline });
    return NextResponse.json({ ok: true, queued: false });
  }

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: email,
    subject: `Live chat lead · ${name}${payload.audience ? ` · ${payload.audience}` : ""}`,
    html,
  });

  if (sendError) {
    console.error("[lead] resend error:", sendError);
    return NextResponse.json({ ok: false, error: "Send failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, queued: true });
}
