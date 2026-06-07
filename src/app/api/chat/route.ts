import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Estimate Intake is BuildHawk's qualifying front desk powered by Hawktress.
// This route proxies the chat widget to the Anthropic Messages API, runs a
// tool-using model so leads can be captured structurally, and falls back to
// the offline reply if anything is missing or broken so the widget never hangs.

type Role = "user" | "assistant";
type Message = { role: Role; content: string };

type ChatPayload = {
  messages?: Message[];
};

type Lead = {
  name?: string;
  email?: string;
  phone?: string;
  audience?: string;
  project?: string;
  region?: string;
  timeline?: string;
  notes?: string;
};

// Default to current stable Sonnet. Override with INTAKE_MODEL in Vercel env
// when a newer Sonnet ships and we want to roll it out. Legacy CHARLIE_MODEL
// still honoured to avoid breaking existing deployments.
const MODEL =
  process.env.INTAKE_MODEL || process.env.CHARLIE_MODEL || "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 600;

// Per-IP rate limit. Keeps abuse cheap. In-memory is fine on a single Vercel
// instance for this traffic; revisit with Vercel KV if Estimate Intake gets popular.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 30;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}

const OFFLINE_REPLY = `Live chat is offline.

Pick the form on this page that matches what you need. Both come straight to the team and we reply within one business day.

• Project to discuss: [Start a brief](https://buildhawk.com.au/#intake)
• Early access to the Hawktress platform: [Join the waitlist](https://buildhawk.com.au/#waitlist)

Urgent? info@buildhawk.com.au or +61 433 366 607`;

const SYSTEM_PROMPT = `You are BuildHawk's Estimate Intake assistant, powered by Hawktress. You are not a named character; you are the firm's front desk workflow for qualifying and routing enquiries.

# Who we are
BuildHawk is a precision construction estimating service for Australian residential builders. Tagline: "Precision Estimating. Disciplined Delivery."
Hawktress is BuildHawk's software platform, a subscription estimating workspace for builders and trades with a supplier directory. Currently in early-access waitlist.
Site: buildhawk.com.au. Reception inbox: info@buildhawk.com.au. Phone: +61 433 366 607.

# Your job
Your job is intake. Identify who the visitor is, what they need, and capture enough information to hand them to the right person on the BuildHawk team. You are not a salesperson and not a free estimating tool. You qualify and route.

# Audiences and what each one needs
Builder wanting an estimate: capture project type (new build, reno, extension), location, rough scope, timeline, budget range if offered. Route to the brief form or a call.
Builder interested in Hawktress: capture company, role, current estimating approach. Route to the waitlist.
Trade (subcontractor): interested in being on the Hawktress platform. Capture trade, region, company. Route to the waitlist.
Supplier: interested in listing products. Capture company, product category. Route to platform listing enquiry.
Owner-builder or homeowner: BuildHawk works through licensed builders, not direct-to-homeowner. Be polite, suggest they engage a builder first, point to Articles.
Recruiter, cold pitch, job seeker: politely deflect to info@buildhawk.com.au.

# Hard rules
Never quote a price, fee, turnaround, or timeline that is not on buildhawk.com.au. If asked, say pricing depends on scope and the team will quote after a short brief. Point to the Pricing page for current tiers.
Never name an illustrative or "ballpark" price range, even to demonstrate variability. Do not list dollar figures of any kind. If a visitor pushes for a number, say pricing depends entirely on scope and route them to the brief or the Pricing page. No exceptions.
Never promise the team will do something specific by a specific date. Use "within one business day" as the standard response window.
Do not fabricate company details, staff names, case studies, or testimonials.
Do not speculate about Hawktress launch dates, features, or pricing beyond what is on the site.
If a visitor asks something outside intake (legal advice, structural engineering, contract law, dispute resolution), say it is outside scope and suggest they speak to a qualified professional.
Keep responses short. One to three short paragraphs maximum.
Use plain punctuation. No em dashes. No emojis. No corporate filler like "great question" or "I'd be happy to."

# Lead capture
When a visitor shows real intent (an actual project to brief or a clear platform interest), naturally ask for name and email so the team can follow up. Phone is optional. Once you have at minimum a name and a valid email, call the submit_lead tool with everything you have gathered from the conversation. Do not capture leads for casual questions, job seekers, or off-topic chats. After capturing a lead, confirm briefly and offer to keep chatting if they have more to add.
If you have exchanged four or more substantive turns with a qualified-looking visitor (a builder with a real project, a trade or supplier with a real interest in Hawktress) and still do not have name and email, gently ask for them in your next reply so the team can follow up. One ask, not repeated nagging. If they decline or change the subject, drop it.

# Tone
Warm, Australian, plainspoken. Brief. You are the front desk at a respected estimating firm, not a chatbot.

# Links you can offer
Render as markdown: [label](url). The widget makes them clickable.
Start a brief: https://buildhawk.com.au/#intake
Join the Hawktress waitlist: https://buildhawk.com.au/#waitlist
Pricing: https://buildhawk.com.au/pricing
How it works: https://buildhawk.com.au/how-it-works
Articles: https://buildhawk.com.au/articles
FAQ: https://buildhawk.com.au/faq
Email: info@buildhawk.com.au
Phone: +61 433 366 607`;

const LEAD_TOOL = {
  name: "submit_lead",
  description:
    "Capture a visitor lead and hand off to the BuildHawk team. Call this only when you have a clear name, a valid email, and a real project or platform intent. The team will follow up within one business day.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Visitor's full name" },
      email: { type: "string", description: "Visitor's email address" },
      phone: { type: "string", description: "Phone number if offered" },
      audience: {
        type: "string",
        enum: ["builder", "trade", "supplier", "owner-builder", "other"],
        description: "Visitor type",
      },
      project: {
        type: "string",
        description:
          "Short description of the project or platform interest. Include scope, location, timeline if known.",
      },
      region: { type: "string", description: "State or city if mentioned" },
      timeline: { type: "string", description: "When they want to start" },
      notes: {
        type: "string",
        description: "Any other detail that would help the team prepare",
      },
    },
    required: ["name", "email"],
  },
};

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ text: OFFLINE_REPLY });
  }

  let payload: ChatPayload;
  try {
    payload = (await req.json()) as ChatPayload;
  } catch {
    return NextResponse.json({ text: OFFLINE_REPLY });
  }

  const messages: Message[] = (payload.messages || [])
    .filter(
      (m): m is Message =>
        Boolean(
          m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
        )
    )
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ text: OFFLINE_REPLY });
  }

  const ip = clientIp(req);
  const limit = rateLimit(ip);
  if (!limit.ok) {
    const mins = Math.max(1, Math.ceil((limit.retryAfter || 60) / 60));
    return NextResponse.json({
      text: `You've hit our chat limit for now. Email info@buildhawk.com.au or call +61 433 366 607 and the team will pick it up. (Try chat again in about ${mins} min.)`,
    });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: [LEAD_TOOL],
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[chat] anthropic error:", res.status, errText);
      return NextResponse.json({ text: OFFLINE_REPLY });
    }

    const data = (await res.json()) as {
      content?: Array<
        | { type: "text"; text: string }
        | { type: "tool_use"; name: string; input: Lead }
      >;
    };

    let text = "";
    let lead: Lead | undefined;
    for (const block of data.content || []) {
      if (block.type === "text" && block.text) {
        text += (text ? "\n\n" : "") + block.text;
      } else if (block.type === "tool_use" && block.name === "submit_lead") {
        lead = block.input;
      }
    }

    // Validate lead before returning. We require name + valid email or we drop
    // it; the widget's /api/lead handler would reject it anyway.
    if (lead) {
      const name = (lead.name || "").trim();
      const email = (lead.email || "").trim();
      if (!name || !email || !isValidEmail(email)) {
        lead = undefined;
      }
    }

    if (!text) {
      text = lead
        ? "Got it. The team will be in touch within one business day. Anything else you want to add?"
        : "Sorry, can you say that again? Or email info@buildhawk.com.au.";
    }

    return NextResponse.json({ text, lead });
  } catch (err) {
    console.error("[chat] error:", err);
    return NextResponse.json({ text: OFFLINE_REPLY });
  }
}
