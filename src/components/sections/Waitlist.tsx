"use client";

import { useState } from "react";
import Reveal from "@/components/motion/Reveal";

type Audience = "builder" | "trade" | "supplier" | "owner-builder" | "other";
type Status = "idle" | "submitting" | "success" | "error";

const audienceOptions: { value: Audience; label: string }[] = [
  { value: "builder", label: "Builder" },
  { value: "trade", label: "Trade" },
  { value: "supplier", label: "Supplier" },
  { value: "owner-builder", label: "Owner-builder" },
  { value: "other", label: "Other" },
];

export default function Waitlist() {
  const [audience, setAudience] = useState<Audience>("builder");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          role: role.trim(),
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Could not save your details");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section
      id="waitlist"
      className="relative bg-bh-ink text-bh-paper py-20 md:py-28 overflow-hidden"
    >
      {/* Subtle grain + emblem accent — section is always dark, so use the
          white+orange variant directly (independent of system theme) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage: "url(/brand/emblem-bh-dark.svg)",
          backgroundSize: "560px",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "calc(100% + 80px) center",
        }}
      />

      <div className="relative mx-auto max-w-[1480px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-8 md:gap-12">
          {/* Pitch column */}
          <div className="col-span-12 md:col-span-5">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-orange mb-6">
              06 / Waitlist
            </p>
            <Reveal as="h2" className="text-[34px] md:text-[44px] lg:text-[56px] leading-[1.05] tracking-[-0.025em] font-medium">
              Join the Hawktress<sup className="text-[0.45em] align-super">™</sup> waitlist.
            </Reveal>
            <Reveal as="p" className="mt-5 text-bh-paper/70 text-[16px] md:text-[18px] leading-[1.55] tracking-[-0.005em] max-w-md" delay={120}>
              Early access for builders, trades, suppliers and owner-builders
              who want the discipline behind every cost decision. Limited
              cohorts. We bring on the operators who fit.
            </Reveal>
            <Reveal as="ul" className="mt-8 space-y-3 text-[14px] text-bh-paper/65" delay={200}>
              <li className="flex items-start gap-3">
                <span className="mt-2 inline-block w-3 h-px bg-bh-orange flex-none" />
                Cost intelligence built from active Australian residential jobs
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 inline-block w-3 h-px bg-bh-orange flex-none" />
                The 5% variance threshold applied to every quote and PO
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 inline-block w-3 h-px bg-bh-orange flex-none" />
                Director-grade monthly reporting with no extra admin
              </li>
            </Reveal>
          </div>

          {/* Form column */}
          <div className="col-span-12 md:col-span-7">
            <Reveal>
              <form
                onSubmit={onSubmit}
                className="bg-bh-white text-bh-black p-6 md:p-8 lg:p-10"
                noValidate
              >
                {status === "success" ? (
                  <div className="py-6">
                    <div className="inline-flex w-12 h-12 rounded-full bg-bh-orange/15 items-center justify-center mb-5">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        aria-hidden
                        className="text-bh-orange"
                      >
                        <path
                          d="M5 11 L9 15 L17 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="text-[22px] md:text-[26px] tracking-[-0.02em] font-medium">
                      You&apos;re on the list, {name.split(" ")[0] || "thanks"}.
                    </h3>
                    <p className="mt-3 text-bh-graphite text-[15px] leading-[1.55] max-w-md">
                      We&apos;ll be in touch as cohort spots open. Reply to the
                      confirmation if you want to flag a specific job or
                      timeline.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-4">
                      Who you are
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {audienceOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAudience(opt.value)}
                          aria-pressed={audience === opt.value}
                          className={`h-10 px-4 rounded-[8px] text-[13px] tracking-[-0.005em] border transition-colors ${
                            audience === opt.value
                              ? "bg-bh-ink text-bh-paper border-bh-black"
                              : "bg-bh-white text-bh-black border-bh-steel hover:border-bh-graphite"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        label="Name"
                        required
                        value={name}
                        onChange={setName}
                        autoComplete="name"
                        placeholder="Jane Smith"
                      />
                      <Field
                        label="Email"
                        required
                        type="email"
                        value={email}
                        onChange={setEmail}
                        autoComplete="email"
                        placeholder="jane@yourbuild.com.au"
                      />
                      <Field
                        label="Company"
                        value={company}
                        onChange={setCompany}
                        autoComplete="organization"
                        placeholder="Smith Builders Pty Ltd"
                      />
                      <Field
                        label="Role"
                        value={role}
                        onChange={setRole}
                        autoComplete="organization-title"
                        placeholder="Director, CA, Estimator…"
                      />
                    </div>

                    <label className="block mt-4">
                      <span className="text-[11px] tracking-[0.18em] uppercase text-bh-graphite">
                        Notes (optional)
                      </span>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Active jobs, timeline, anything that helps us prioritise."
                        className="mt-2 w-full bg-bh-cloud border border-bh-steel/60 px-4 py-3 text-[15px] tracking-[-0.005em] text-bh-black placeholder:text-bh-graphite/70 focus:border-bh-orange focus:outline-none transition-colors resize-none"
                      />
                    </label>

                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <p className="text-[12px] text-bh-graphite leading-[1.5] max-w-md">
                        We&apos;ll only use your details to evaluate fit and contact
                        you about the waitlist. See our{" "}
                        <a
                          href="/data-policy"
                          className="text-bh-black underline underline-offset-4 hover:text-bh-orange transition-colors"
                        >
                          data policy
                        </a>
                        .
                      </p>
                      <button
                        type="submit"
                        disabled={status === "submitting"}
                        className="group inline-flex items-center justify-between gap-4 rounded-[8px] pl-6 pr-2 h-12 text-[14px] tracking-[-0.005em] font-medium bg-bh-orange text-bh-paper hover:bg-bh-orange-700 active:bg-bh-orange-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>
                          {status === "submitting" ? "Saving…" : "Join the waitlist"}
                        </span>
                        <span className="inline-flex items-center justify-center rounded-full w-9 h-9 bg-bh-white/20 group-hover:bg-bh-white/30 transition-colors">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            className="stroke-bh-white"
                            aria-hidden
                          >
                            <path
                              d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>

                    {status === "error" && (
                      <p className="mt-4 text-[13px] text-bh-orange-700">
                        {errorMessage || "Could not save. Try again."}
                      </p>
                    )}
                  </>
                )}
              </form>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.18em] uppercase text-bh-graphite">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 w-full h-12 bg-bh-cloud border border-bh-steel/60 px-4 text-[15px] tracking-[-0.005em] text-bh-black placeholder:text-bh-graphite/70 focus:border-bh-orange focus:outline-none transition-colors"
      />
    </label>
  );
}
