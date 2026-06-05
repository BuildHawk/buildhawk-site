/**
 * Cost Plan Console access request.
 *
 * Self-serve top-of-funnel for the gated /command-centre product. Anyone can
 * apply; the application lands in the BuildHawk GHL Lead Qualification
 * pipeline at "New Lead" with tags ["cost-plan-console", "access-request"].
 * The team triages and adds approved emails to BH_AUTHORIZED_EMAILS by hand
 * before redeploy. (Self-serve provisioning is a separate Phase 2 build.)
 *
 * Always responds {ok:true} to the client even on lookup/email failure so the
 * UX stays predictable; failures are logged server-side.
 */
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { upsertContact, createOpportunity } from "@/lib/ghl";

export const runtime = "nodejs";

type Payload = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  projectsPerYear?: string;
  primaryRegion?: string;
  currentTools?: string;
  notes?: string;
};

const NOTIFY_TO =
  process.env.CPC_ACCESS_REQUEST_TO || "services@buildhawk.com.au";
const NOTIFY_FROM =
  process.env.BH_AUTH_FROM_EMAIL ||
  "BuildHawk Cost Plan Console <noreply@buildhawk.com.au>";

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderTeamEmail = (p: Required<Pick<Payload, "name" | "email" | "company">> & Payload) => {
  const rows: Array<[string, string | undefined]> = [
    ["Name", p.name],
    ["Email", p.email],
    ["Phone", p.phone],
    ["Company", p.company],
    ["Role", p.role],
    ["Projects per year", p.projectsPerYear],
    ["Primary region", p.primaryRegion],
    ["Current tools", p.currentTools],
  ];
  const tableRows = rows
    .filter(([, v]) => v && v.trim())
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;vertical-align:top;">${escapeHtml(
          k,
        )}</td><td style="padding:6px 0;color:#111;font-size:15px;">${escapeHtml(
          v ?? "",
        )}</td></tr>`,
    )
    .join("");
  const notes = p.notes
    ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #d3d6e0;"><p style="margin:0 0 6px;color:#6e7180;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Notes</p><p style="margin:0;color:#111;font-size:15px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(
        p.notes,
      )}</p></div>`
    : "";
  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;background:#edeff7;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d3d6e0;">
    <div style="background:#111;color:#fff;padding:18px 24px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#bcbfcc;">BuildHawk · Powered by Hawktress&trade;</p>
      <p style="margin:6px 0 0;font-size:18px;font-weight:600;letter-spacing:-0.01em;">Access request from ${escapeHtml(p.name)}</p>
    </div>
    <div style="padding:24px;">
      <table style="border-collapse:collapse;width:100%;">${tableRows}</table>
      ${notes}
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #d3d6e0;font-size:12px;color:#6e7180;">
        To approve: add <code style="background:#f1f3f9;padding:2px 6px;border-radius:3px;color:#111;">${escapeHtml(p.email)}</code> to <code style="background:#f1f3f9;padding:2px 6px;border-radius:3px;color:#111;">BH_AUTHORIZED_EMAILS</code> in Vercel and redeploy.
      </div>
    </div>
    <div style="background:#de5123;height:6px;"></div>
  </div>
</body></html>`;
  const text = [
    "BuildHawk Cost Plan Console — new access request",
    "",
    ...rows.filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v}`),
    p.notes ? `\nNotes:\n${p.notes}` : "",
    "",
    `To approve: add ${p.email} to BH_AUTHORIZED_EMAILS in Vercel and redeploy.`,
  ].join("\n");
  return { html, text };
};

const renderApplicantEmail = (p: Required<Pick<Payload, "name">> & Payload) => {
  const firstName = p.name.split(" ")[0];
  const text = `Hi ${firstName},

Thanks for applying for a BuildHawk engagement.

We'll review your application and get back to you within one business day. If we're a fit we'll send a sign-in link to ${p.email}.

If you have questions in the meantime, reply to this email.

— BuildHawk`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F6F7F9;font-family:Inter,system-ui,sans-serif;color:#111;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:36px;height:28px;background:#DE5123;border-radius:6px;"></div>
      <div>
        <div style="font-weight:700;font-size:13px;letter-spacing:0.04em;">BUILDHAWK</div>
        <div style="font-size:9px;letter-spacing:0.16em;color:#6e7180;text-transform:uppercase;">Powered by Hawktress&trade;</div>
      </div>
    </div>
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.01em;margin:0 0 12px;">Application received</h1>
    <p style="font-size:14px;color:#475569;margin:0 0 18px;line-height:1.5;">Hi ${escapeHtml(firstName)}, thanks for applying. We'll review your details and reply within one business day. If we're a fit, we'll send a sign-in link to <strong>${escapeHtml(p.email ?? "")}</strong>.</p>
    <p style="font-size:13px;color:#94a3b8;margin:24px 0 0;">If you have questions in the meantime, just reply to this email.</p>
  </div>
</body></html>`;
  return { html, text };
};

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const company = (body.company ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 });
  if (!company)
    return NextResponse.json({ ok: false, error: "Company is required" }, { status: 400 });

  const cleaned: Payload = {
    name,
    email,
    company,
    phone: body.phone?.trim() || undefined,
    role: body.role?.trim() || undefined,
    projectsPerYear: body.projectsPerYear?.trim() || undefined,
    primaryRegion: body.primaryRegion?.trim() || undefined,
    currentTools: body.currentTools?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
  };

  // 1) Route to BuildHawk GHL Lead Qualification pipeline. Failure here does
  //    not block the response; we still email the team so requests are not lost.
  try {
    const contactId = await upsertContact({
      name,
      email,
      phone: cleaned.phone,
      company,
      source: "cost-plan-console-access-request",
      tags: ["cost-plan-console", "access-request"],
    });
    if (contactId) {
      await createOpportunity({
        contactId,
        name: `Cost Plan Console access · ${company}`,
        source: "cost-plan-console-access-request",
      });
    }
  } catch (err) {
    console.error("[cpc-access] GHL routing failed:", err);
  }

  // 2) Notify the team + send confirmation to the applicant.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const team = renderTeamEmail({ ...cleaned, name, email, company });
      await resend.emails.send({
        from: NOTIFY_FROM,
        to: NOTIFY_TO,
        replyTo: email,
        subject: `Cost Plan Console access request · ${company}`,
        html: team.html,
        text: team.text,
      });
      const applicant = renderApplicantEmail({ ...cleaned, name });
      await resend.emails.send({
        from: NOTIFY_FROM,
        to: email,
        subject: "We received your BuildHawk Cost Plan Console request",
        html: applicant.html,
        text: applicant.text,
      });
    } catch (err) {
      console.error("[cpc-access] notification email failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
