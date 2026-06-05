"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Tenant = {
  id: string;
  name: string;
  status: string;
};

type GhlForm = {
  apiKey: string;
  locationId: string;
  projectDataFieldId: string;
};

type Step = 1 | 2 | 3;

const Stepper = ({ active }: { active: Step }) => {
  const steps = [
    { n: 1, label: "Brief" },
    { n: 2, label: "Connect" },
    { n: 3, label: "Live data" },
  ];
  return (
    <ol className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-bold">
      {steps.map((s, i) => (
        <li key={s.n} className="flex items-center gap-2">
          <span
            className={`inline-flex w-7 h-7 rounded-full items-center justify-center border ${
              s.n === active
                ? "bg-bh-ink text-white border-bh-ink"
                : s.n < active
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-white/70 text-slate-500 border-slate-300"
            }`}
          >
            {s.n < active ? "✓" : s.n}
          </span>
          <span className={s.n === active ? "text-slate-900" : "text-slate-500"}>
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-slate-400">·</span>}
        </li>
      ))}
    </ol>
  );
};

export default function OnboardingWizard({
  tenant,
  user,
}: {
  tenant: Tenant;
  user: { email: string; name: string | null };
}) {
  const [step, setStep] = useState<Step>(1);
  const [ghl, setGhl] = useState<GhlForm>({
    apiKey: "",
    locationId: "",
    projectDataFieldId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectGhl = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/command-centre/integrations/ghl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: ghl.apiKey.trim(),
          locationId: ghl.locationId.trim(),
          projectDataFieldId: ghl.projectDataFieldId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStep(3);
      } else {
        setError(data.error ?? "Could not save GHL connection");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link
        href="/command-centre"
        className="flex items-center gap-2.5 mb-8"
        aria-label="BuildHawk home"
      >
        <Image
          src="/brand/emblem-bh.svg"
          alt="BuildHawk"
          width={42}
          height={32}
          priority
          className="block"
        />
        <div className="leading-tight">
          <div className="text-bh-black font-semibold uppercase" style={{ fontSize: 15, letterSpacing: "0.04em" }}>
            BUILDHAWK
          </div>
          <div className="text-bh-graphite mt-0.5 uppercase font-semibold" style={{ fontSize: 10, letterSpacing: "0.18em" }}>
            Cost Plan Console
          </div>
        </div>
      </Link>

      <div className="mb-6">
        <Stepper active={step} />
      </div>

      <section
        className="relative rounded-3xl border border-white/40 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
          backdropFilter: "blur(28px) saturate(140%)",
          WebkitBackdropFilter: "blur(28px) saturate(140%)",
        }}
      >
        <div className="p-6 sm:p-10">
          {step === 1 && (
            <>
              <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
                Brief
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                Hi {user.name?.split(" ")[0] ?? user.email}, your engagement is set up
              </h1>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-xl">
                <strong className="text-slate-900">{tenant.name}</strong> is live in the Cost
                Plan Console. Next, connect your GHL account so we can pull your active
                projects and write workbook overlays back. Takes 60 seconds.
              </p>
              <ul className="mt-6 text-sm text-slate-700 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  We read your active opportunities + contacts (read scopes).
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  We write workbook financials to a single multi-line custom field per
                  opportunity (write scopes).
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  Your GHL token is encrypted at rest with AES-256-GCM. We never log it.
                </li>
              </ul>
              <div className="mt-7 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-bh-ink text-white text-sm font-semibold hover:bg-bh-ink/90"
                >
                  Connect GHL →
                </button>
                <Link
                  href="/command-centre"
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Skip for now
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
                Connect
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                Paste your GHL Private Integration token
              </h2>
              <details className="mt-3 text-sm text-slate-600">
                <summary className="cursor-pointer font-semibold text-slate-700">
                  How do I find these values?
                </summary>
                <ol className="mt-2 list-decimal pl-5 space-y-1 text-[13px] leading-relaxed">
                  <li>
                    In GHL, go to <strong>Settings → Private Integrations → Create</strong>.
                  </li>
                  <li>
                    Scopes:{" "}
                    <code className="font-mono bg-white/70 px-1 rounded">
                      contacts.readonly
                    </code>
                    ,{" "}
                    <code className="font-mono bg-white/70 px-1 rounded">contacts.write</code>
                    ,{" "}
                    <code className="font-mono bg-white/70 px-1 rounded">
                      opportunities.readonly
                    </code>
                    ,{" "}
                    <code className="font-mono bg-white/70 px-1 rounded">
                      opportunities.write
                    </code>
                    .
                  </li>
                  <li>Copy the token (starts with <code>pit-</code>) and paste below.</li>
                  <li>
                    Your <strong>Location ID</strong> is in{" "}
                    <strong>Settings → Business Profile → General Information</strong>.
                  </li>
                  <li>
                    Optional: create a Multi Line custom field on opportunities named
                    "BuildHawk Project Data" (key{" "}
                    <code className="font-mono bg-white/70 px-1 rounded">bh_project_data</code>
                    ). Paste the field ID below to enable workbook saves.
                  </li>
                </ol>
              </details>

              <form onSubmit={connectGhl} className="mt-5 space-y-4">
                <Field label="GHL Private Integration token" required>
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={ghl.apiKey}
                    onChange={(e) => setGhl((g) => ({ ...g, apiKey: e.target.value }))}
                    placeholder="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className={inputCls}
                  />
                </Field>
                <Field label="GHL Location ID" required>
                  <input
                    type="text"
                    required
                    value={ghl.locationId}
                    onChange={(e) => setGhl((g) => ({ ...g, locationId: e.target.value }))}
                    placeholder="20-character ID"
                    className={inputCls}
                  />
                </Field>
                <Field label="Workbook custom field ID (optional)">
                  <input
                    type="text"
                    value={ghl.projectDataFieldId}
                    onChange={(e) =>
                      setGhl((g) => ({ ...g, projectDataFieldId: e.target.value }))
                    }
                    placeholder="Leave blank to skip workbook overlay saves"
                    className={inputCls}
                  />
                </Field>

                {error && (
                  <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-bh-orange text-white text-sm font-semibold hover:bg-bh-orange/90 disabled:opacity-60"
                  >
                    {saving ? "Connecting..." : "Connect GHL"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2"
                  >
                    Skip — I'll connect later from Settings
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700 font-bold">
                Live data
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                {tenant.name} is live
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-xl">
                Head into the Cost Plan Console to see your projects, fill workbooks, and
                let the intelligence brief draft your director updates. We're here if you
                need us.
              </p>
              <div className="mt-7 flex gap-3">
                <Link
                  href="/command-centre"
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-bh-ink text-white text-sm font-semibold hover:bg-bh-ink/90"
                >
                  Open Cost Plan Console →
                </Link>
                <Link
                  href="/command-centre/settings"
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Add an authorised user
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

const inputCls =
  "block w-full bg-white border border-slate-300 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bh-orange focus:border-bh-orange text-slate-900";

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
      {label}
      {required && <span className="text-bh-orange ml-0.5">*</span>}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);
