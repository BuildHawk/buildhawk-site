import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
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

  const formData = await req.formData();

  const body: IntakePayload = {
    audience: String(formData.get("audience") || ""),
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    company: String(formData.get("company") || ""),
    role: String(formData.get("role") || ""),
    projectType: String(formData.get("projectType") || ""),
    stage: String(formData.get("stage") || ""),
    valueRange: String(formData.get("valueRange") || ""),
    message: String(formData.get("message") || ""),
  };

  const uploadedFiles: {
    name: string;
    url: string;
    size: number;
  }[] = [];

  const files = formData.getAll("files") as File[];

  console.log("Files received:", files.length);
  
  for (const file of files) {
    console.log("Uploading file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });
  
    if (file.size === 0) continue;
  
    const blob = await put(
      `intake/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
      }
    );
  
    console.log("Blob uploaded:", blob.url);
  
    uploadedFiles.push({
      name: file.name,
      url: blob.url,
      size: file.size,
    });
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
        body: JSON.stringify({
          ...body,
          documents: uploadedFiles,
        }),
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
