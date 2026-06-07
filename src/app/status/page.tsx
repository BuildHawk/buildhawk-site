import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Status · BuildHawk",
  description: "Live status of BuildHawk Cost Plan Console core services.",
};

export const dynamic = "force-dynamic";

type HealthResponse = {
  ok: boolean;
  status: "green" | "yellow" | "red";
  timestamp: string;
  saas: Record<string, boolean>;
  optional: Record<string, boolean>;
};

const labels: Record<string, string> = {
  authSecret: "Session signing key",
  database: "Application database",
  encryptionKey: "Credential encryption",
  resend: "Transactional email",
  ghlLeadCapture: "Lead capture (BuildHawk GHL)",
  ghlHomesByNh: "Founding subscriber GHL",
  workbookField: "Workbook overlay field",
  anthropic: "AI co-pilot",
};

const STATUS_COPY: Record<HealthResponse["status"], string> = {
  green: "All systems operational",
  yellow: "Operating with reduced capability",
  red: "Major service degraded",
};

const STATUS_TONE: Record<HealthResponse["status"], string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  yellow: "bg-amber-100 text-amber-800 border-amber-200",
  red: "bg-rose-100 text-rose-800 border-rose-200",
};

async function fetchHealth(): Promise<HealthResponse | null> {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  try {
    const res = await fetch(`${origin}/api/health`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export default async function StatusPage() {
  const health = await fetchHealth();

  if (!health) {
    return (
      <main className="min-h-screen bg-bh-paper text-bh-black px-6 py-16 flex items-center">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Status unavailable</h1>
          <p className="mt-3 text-sm text-bh-graphite">
            We couldn&apos;t reach the health endpoint. If this persists, email{" "}
            <a
              href="mailto:info@buildhawk.com.au"
              className="font-semibold underline underline-offset-2"
            >
              info@buildhawk.com.au
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bh-paper text-bh-black px-6 py-12 md:py-20">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-[12px] uppercase tracking-[0.2em] text-bh-graphite hover:text-bh-black"
        >
          ← BuildHawk
        </Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
          BuildHawk status
        </h1>
        <p className="mt-2 text-[14px] md:text-[15px] text-bh-graphite">
          Live status of the Cost Plan Console and its core dependencies. Auto-refreshes on
          page reload. Last checked{" "}
          <span className="tabular-nums">
            {new Date(health.timestamp).toLocaleString("en-AU", {
              hour: "numeric",
              minute: "numeric",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          .
        </p>

        <div className={`mt-6 rounded-2xl border px-5 py-4 ${STATUS_TONE[health.status]}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] font-bold">
                Overall · {health.status}
              </div>
              <div className="mt-1 text-lg font-bold tracking-tight">
                {STATUS_COPY[health.status]}
              </div>
            </div>
            <Indicator status={health.status} />
          </div>
        </div>

        <Section title="Core services" rows={health.saas} />
        <Section title="Integrations" rows={health.optional} />

        <p className="mt-10 text-[12px] text-bh-graphite">
          For incidents or planned maintenance, email{" "}
          <a
            href="mailto:info@buildhawk.com.au"
            className="font-semibold underline underline-offset-2"
          >
            info@buildhawk.com.au
          </a>
          .
        </p>
      </div>
    </main>
  );
}

const Section = ({ title, rows }: { title: string; rows: Record<string, boolean> }) => (
  <section className="mt-8">
    <div className="text-[11px] uppercase tracking-[0.2em] text-bh-graphite font-semibold">
      {title}
    </div>
    <ul className="mt-3 divide-y divide-bh-steel/40 border border-bh-steel/40 rounded-xl bg-bh-white overflow-hidden">
      {Object.entries(rows).map(([key, ok]) => (
        <li key={key} className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="font-medium">{labels[key] ?? key}</span>
          <span
            className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${
              ok ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                ok ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            {ok ? "Operational" : "Down"}
          </span>
        </li>
      ))}
    </ul>
  </section>
);

const Indicator = ({ status }: { status: HealthResponse["status"] }) => (
  <span
    className={`inline-flex w-9 h-9 rounded-full items-center justify-center ${
      status === "green"
        ? "bg-emerald-500"
        : status === "yellow"
          ? "bg-amber-500"
          : "bg-rose-500"
    }`}
  >
    <span className="w-2 h-2 rounded-full bg-white" />
  </span>
);
