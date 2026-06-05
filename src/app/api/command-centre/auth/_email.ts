/**
 * Shared email rendering + sending for the auth flow.
 */
import type { Resend } from "resend";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://www.buildhawk.com.au");

const FROM =
  process.env.BH_AUTH_FROM_EMAIL ||
  "BuildHawk Cost Plan Console <noreply@buildhawk.com.au>";

export const magicLinkUrl = (token: string) =>
  `${SITE_URL}/api/command-centre/auth/verify?token=${encodeURIComponent(token)}`;

export type EmailMode = "signin" | "signup" | "invite";

export function renderMagicLinkEmail(opts: {
  link: string;
  mode: EmailMode;
  tenantName?: string;
  invitedBy?: string;
}) {
  const { link, mode, tenantName, invitedBy } = opts;
  const headline =
    mode === "signin"
      ? "Your sign-in link"
      : mode === "signup"
        ? "Confirm your BuildHawk account"
        : `${invitedBy ?? "A teammate"} invited you to ${tenantName ?? "BuildHawk"}`;
  const intro =
    mode === "signin"
      ? "Click below to access the BuildHawk Cost Plan Console. This link expires in 30 minutes and can only be used once."
      : mode === "signup"
        ? "Click below to confirm your email and finish setting up your BuildHawk engagement. This link expires in 30 minutes."
        : `Click below to accept the invitation and join ${tenantName ?? "the engagement"}. This link expires in 30 minutes.`;
  const cta =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Confirm email" : "Accept invite";

  const text = `${headline}

${intro}

${link}

If you didn't request this, ignore this email.`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F6F7F9;font-family:Inter,system-ui,sans-serif;color:#111;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:36px;height:28px;background:#DE5123;border-radius:6px;"></div>
      <div>
        <div style="font-weight:700;font-size:13px;letter-spacing:0.04em;">BUILDHAWK</div>
        <div style="font-size:9px;letter-spacing:0.16em;color:#6e7180;text-transform:uppercase;">Powered by Hawktress&trade;</div>
      </div>
    </div>
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.01em;margin:0 0 12px;">${headline}</h1>
    <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.5;">${intro}</p>
    <a href="${link}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:8px;">${cta} →</a>
    <p style="font-size:12px;color:#94a3b8;margin:32px 0 0;line-height:1.5;word-break:break-all;">Trouble with the button? Paste this URL into your browser:<br/>${link}</p>
    <p style="font-size:11px;color:#94a3b8;margin:32px 0 0;">If you didn't request this, ignore this email. Your account stays safe.</p>
  </div>
</body></html>`;
  return { text, html };
}

export async function sendAuthEmail(
  resend: Resend,
  args: { to: string; subject: string; html: string; text: string },
) {
  return resend.emails.send({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
}
