import { NextResponse } from "next/server";
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

  // Send to n8n webhook and wait for its response
  try {
    const webhookRes = await fetch(
      "https://buildhawk.app.n8n.cloud/webhook/buildhawk-signup-save-ghl",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!webhookRes.ok) {
      console.error("[intake] webhook returned", webhookRes.status);
      return NextResponse.json(
        { error: "Could not send right now. Please email info@buildhawk.com.au" },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[intake] webhook unreachable:", err);
    return NextResponse.json(
      { error: "Could not send right now. Please email info@buildhawk.com.au" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
