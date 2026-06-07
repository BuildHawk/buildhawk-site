"use client";

import { useEffect, useState } from "react";
import type { IntelligenceBrief, IntelligenceBullet } from "@/lib/intelligence";

type FetchInput =
  | { kind: "portfolio"; payload: unknown }
  | { kind: "project"; id: string };

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; brief: IntelligenceBrief }
  | { status: "error"; message: string };

const TONE_DOT: Record<NonNullable<IntelligenceBullet["tone"]>, string> = {
  info: "bg-sky-400",
  good: "bg-emerald-500",
  warn: "bg-bh-orange",
  bad: "bg-rose-500",
};

export default function IntelligenceBriefView({
  input,
  context,
  autoLoad = true,
}: {
  input: FetchInput;
  context?: string; // small label shown in the header chip
  autoLoad?: boolean;
}) {
  const [state, setState] = useState<State>({ status: "idle" });

  const fetchBrief = async () => {
    setState({ status: "loading" });
    try {
      const url =
        input.kind === "portfolio"
          ? "/api/command-centre/intelligence/portfolio"
          : `/api/command-centre/intelligence/project/${input.id}`;
      const init: RequestInit =
        input.kind === "portfolio"
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input.payload),
            }
          : { method: "POST" };
      const res = await fetch(url, init);
      const data = await res.json();
      if (!res.ok || !data.ok)
        return setState({
          status: "error",
          message: data.error ?? `Request failed (${res.status})`,
        });
      setState({ status: "ready", brief: data.brief });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch the brief on mount/auto-load (sets loading state)
    if (autoLoad) fetchBrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, input.kind, input.kind === "project" ? input.id : ""]);

  const confColor: Record<string, string> = {
    high: "bg-emerald-100 text-emerald-700 border-emerald-200",
    medium: "bg-sky-100 text-sky-700 border-sky-200",
    low: "bg-bh-orange-50 text-bh-orange-700 border-bh-orange-200/60",
  };

  return (
    <section
      className="relative rounded-3xl border border-white/40 overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, rgba(17,24,39,0.92) 0%, rgba(31,41,55,0.88) 60%, rgba(91,33,182,0.55) 100%)",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
      }}
    >
      {/* Edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
        }}
      />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-bold">
            <span className="inline-flex items-center gap-1.5">
              <SparkIcon />
              <span>Builder Intelligence</span>
            </span>
            {context && (
              <span className="text-white/50 font-semibold">· {context}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {state.status === "ready" && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${confColor[state.brief.confidence]}`}
              >
                {state.brief.confidence} confidence
              </span>
            )}
            <button
              type="button"
              onClick={fetchBrief}
              disabled={state.status === "loading"}
              className="text-[11px] font-semibold text-white/70 hover:text-white border border-white/15 rounded-full px-2.5 py-0.5 backdrop-blur disabled:opacity-50"
            >
              {state.status === "loading" ? "Thinking…" : "Refresh"}
            </button>
          </div>
        </div>

        {state.status === "loading" && (
          <div className="mt-5 animate-pulse space-y-2">
            <div className="h-5 w-3/4 bg-white/10 rounded-md" />
            <div className="h-4 w-full bg-white/10 rounded-md" />
            <div className="h-4 w-5/6 bg-white/10 rounded-md" />
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-4 rounded-2xl border border-rose-300/40 bg-rose-500/10 p-3 text-sm text-rose-100">
            <strong className="block font-bold mb-0.5">AI brief unavailable.</strong>
            {state.message}
            {state.message.includes("ANTHROPIC_API_KEY") && (
              <div className="mt-1.5 text-xs text-rose-200/80">
                Set the key in Vercel env vars to enable Builder Intelligence.
              </div>
            )}
          </div>
        )}

        {state.status === "ready" && (
          <div className="mt-4 space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
                {state.brief.headline}
              </h2>
              <p className="mt-2 text-sm text-white/75 leading-relaxed">{state.brief.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BulletGroup
                title="Focus today"
                tone="info"
                bullets={state.brief.focusToday}
                emptyText="Nothing urgent."
              />
              <BulletGroup
                title="Flags"
                tone="warn"
                bullets={state.brief.flags}
                emptyText="No flags raised."
              />
              <BulletGroup
                title="Recommendations"
                tone="good"
                bullets={state.brief.recommendations}
                emptyText="No actions suggested."
              />
            </div>

            <div className="text-[10px] text-white/40 mono-numbers">
              Generated by Hawktress AI at{" "}
              {new Date(state.brief.generatedAt).toLocaleTimeString("en-AU", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · Director sign-off applies to all outputs.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BulletGroup({
  title,
  tone,
  bullets,
  emptyText,
}: {
  title: string;
  tone: "info" | "warn" | "good";
  bullets: IntelligenceBullet[];
  emptyText: string;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 p-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/55 font-bold">
        {title}
      </div>
      {bullets.length === 0 ? (
        <div className="mt-2 text-xs text-white/40">{emptyText}</div>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/85 leading-snug">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TONE_DOT[b.tone ?? tone]}`}
              />
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SparkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5"
  >
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" />
  </svg>
);
