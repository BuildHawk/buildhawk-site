"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "../data";

type AskAnswer = {
  answer: string;
  citations: { kind: "project" | "metric" | "policy"; ref: string; note?: string }[];
  confidence: "high" | "medium" | "low";
};

type AskState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "answered"; answer: AskAnswer }
  | { status: "error"; message: string };

type ProjectHit = {
  id: string;
  title: string;
  subtitle: string;
  match: number;
};

const fmtCurrency = (n: number) =>
  "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const score = (q: string, hay: string) => {
  if (!q) return 0;
  const Q = q.toLowerCase();
  const H = hay.toLowerCase();
  if (H === Q) return 100;
  if (H.startsWith(Q)) return 80;
  if (H.includes(Q)) return 60;
  // letter-by-letter sub-sequence (fuzzy)
  let i = 0;
  for (const c of H) {
    if (c === Q[i]) i++;
    if (i === Q.length) return 30;
  }
  return 0;
};

const looksLikeQuestion = (q: string) =>
  q.length > 8 &&
  (/\?$/.test(q) ||
    /^(what|why|how|when|where|who|which|should|is |are |can |could |would |will )/i.test(
      q,
    ));

export default function CommandPalette({
  open,
  onClose,
  projects,
  onSelectProject,
  aiConfigured,
  intelligencePayload,
}: {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onSelectProject: (id: string) => void;
  aiConfigured: boolean;
  intelligencePayload: unknown;
}) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [ask, setAsk] = useState<AskState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset palette state when it opens
      setQuery("");
      setHighlight(0);
      setAsk({ status: "idle" });
      // Slight delay so the autoFocus settles after the spring animation
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Project hits, ranked
  const hits: ProjectHit[] = useMemo(() => {
    if (!query.trim()) {
      return projects.slice(0, 6).map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: `${p.region} · ${p.type} · ${fmtCurrency(p.budget)}`,
        match: 0,
      }));
    }
    return projects
      .map((p) => {
        const m = Math.max(
          score(query, p.name),
          score(query, p.region),
          score(query, p.type),
          score(query, p.id),
        );
        return {
          id: p.id,
          title: p.name,
          subtitle: `${p.region} · ${p.type} · ${fmtCurrency(p.budget)}`,
          match: m,
        };
      })
      .filter((h) => h.match > 0)
      .sort((a, b) => b.match - a.match)
      .slice(0, 8);
  }, [projects, query]);

  const showAskItem = aiConfigured && query.trim().length > 0;
  const askIndex = hits.length;
  const itemCount = hits.length + (showAskItem ? 1 : 0);

  const runAsk = async () => {
    if (!aiConfigured) return;
    setAsk({ status: "loading" });
    try {
      const res = await fetch("/api/command-centre/intelligence/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query.trim(),
          ...(intelligencePayload as Record<string, unknown>),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok)
        setAsk({ status: "answered", answer: data.answer as AskAnswer });
      else
        setAsk({
          status: "error",
          message: data.error ?? `Request failed (${res.status})`,
        });
    } catch (e) {
      setAsk({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const onSelect = (i: number) => {
    if (i < hits.length) {
      onSelectProject(hits[i].id);
      onClose();
    } else if (showAskItem && i === askIndex) {
      runAsk();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (itemCount === 0 ? 0 : (h + 1) % itemCount));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (itemCount === 0 ? 0 : (h - 1 + itemCount) % itemCount));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(highlight);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh] sm:pt-[18vh] cmd-palette-enter">
      {/* Backdrop */}
      <div
        className="absolute inset-0 cmd-palette-backdrop"
        style={{
          background: "rgba(2, 6, 23, 0.42)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and ask Hawktress"
        className="relative w-full max-w-xl rounded-3xl border border-white/40 overflow-hidden cmd-palette-panel"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 100%)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          boxShadow:
            "0 30px 80px -20px rgba(15,23,42,0.45), 0 0 0 1px rgba(255,255,255,0.5) inset",
        }}
      >
        {/* Inner highlight */}
        <div
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
          }}
        />

        {/* Search row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/50">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
              setAsk({ status: "idle" });
            }}
            onKeyDown={onKeyDown}
            placeholder={
              aiConfigured
                ? "Search estimates or ask Hawktress…"
                : "Search estimates, quotes, suppliers…"
            }
            className="flex-1 bg-transparent border-0 text-base focus:outline-none placeholder:text-slate-400"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {ask.status === "answered" ? (
            <AnswerView
              answer={ask.answer}
              question={query}
              onClose={onClose}
              onAskAnother={() => setAsk({ status: "idle" })}
            />
          ) : ask.status === "loading" ? (
            <AskLoadingView question={query} />
          ) : ask.status === "error" ? (
            <AskErrorView
              message={ask.message}
              onRetry={runAsk}
              onClose={() => setAsk({ status: "idle" })}
            />
          ) : (
            <ResultsList
              hits={hits}
              query={query}
              showAskItem={showAskItem}
              askIndex={askIndex}
              highlight={highlight}
              onHover={setHighlight}
              onSelect={onSelect}
              isQuestion={looksLikeQuestion(query)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/50 bg-white/40 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono px-1 py-0.5 rounded bg-white/80 border border-slate-200">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono px-1 py-0.5 rounded bg-white/80 border border-slate-200">
                ↵
              </kbd>{" "}
              select
            </span>
          </div>
          {aiConfigured ? (
            <span className="flex items-center gap-1.5">
              <SparkIcon />
              Powered by Hawktress AI
            </span>
          ) : (
            <span>Hawktress AI off</span>
          )}
        </div>
      </div>

      <style jsx>{`
        .cmd-palette-enter {
          animation: cp-enter 240ms cubic-bezier(0.22, 1.2, 0.36, 1) both;
        }
        .cmd-palette-backdrop {
          animation: cp-fade 200ms ease both;
        }
        .cmd-palette-panel {
          animation: cp-spring 320ms cubic-bezier(0.18, 1.4, 0.4, 1) both;
        }
        @keyframes cp-enter {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes cp-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes cp-spring {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          60% {
            opacity: 1;
            transform: translateY(2px) scale(1.005);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function ResultsList({
  hits,
  query,
  showAskItem,
  askIndex,
  highlight,
  onHover,
  onSelect,
  isQuestion,
}: {
  hits: ProjectHit[];
  query: string;
  showAskItem: boolean;
  askIndex: number;
  highlight: number;
  onHover: (i: number) => void;
  onSelect: (i: number) => void;
  isQuestion: boolean;
}) {
  return (
    <div className="py-2">
      {hits.length === 0 && !showAskItem && (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          {query.trim() ? "No estimates match your search." : "Type to search estimates."}
        </div>
      )}

      {hits.length > 0 && (
        <div>
          <div className="px-5 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold">
            {query.trim() ? "Estimates" : "Recent estimates"}
          </div>
          {hits.map((h, i) => (
            <button
              key={h.id}
              onMouseEnter={() => onHover(i)}
              onClick={() => onSelect(i)}
              className={`w-full text-left flex items-center gap-3 px-5 py-2.5 transition ${
                highlight === i
                  ? "bg-bh-orange/12 text-bh-orange-700"
                  : "text-slate-800 hover:bg-slate-100/70"
              }`}
            >
              <ProjectIcon active={highlight === i} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{h.title}</div>
                <div className="text-[11px] text-slate-500 truncate">{h.subtitle}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Estimate
              </span>
            </button>
          ))}
        </div>
      )}

      {showAskItem && (
        <div className="border-t border-slate-200/40 mt-2 pt-2">
          <div className="px-5 pt-1 pb-1 text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold">
            Ask Hawktress
          </div>
          <button
            onMouseEnter={() => onHover(askIndex)}
            onClick={() => onSelect(askIndex)}
            className={`w-full text-left flex items-center gap-3 px-5 py-3 transition ${
              highlight === askIndex
                ? "bg-bh-orange/12 text-bh-orange-700"
                : "text-slate-800 hover:bg-slate-100/70"
            }`}
          >
            <SparkIcon />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {isQuestion ? `Ask: "${query}"` : `Reason about: "${query}"`}
              </div>
              <div className="text-[11px] text-slate-500">
                Grounded in your cost plan. Suggest, never auto-apply.
              </div>
            </div>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-500">
              ↵
            </kbd>
          </button>
        </div>
      )}
    </div>
  );
}

function AskLoadingView({ question }: { question: string }) {
  return (
    <div className="px-5 py-5 space-y-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold flex items-center gap-1.5">
        <SparkIcon /> Hawktress is thinking
      </div>
      <div className="text-sm text-slate-700">{question}</div>
      <div className="space-y-1.5 animate-pulse">
        <div className="h-3 w-full bg-slate-200/60 rounded" />
        <div className="h-3 w-11/12 bg-slate-200/60 rounded" />
        <div className="h-3 w-7/12 bg-slate-200/60 rounded" />
      </div>
    </div>
  );
}

function AskErrorView({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="px-5 py-5 space-y-2.5">
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">
        <strong className="font-bold block mb-0.5">Hawktress couldn&apos;t answer.</strong>
        {message}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRetry}
          className="h-8 px-3 rounded-lg bg-bh-ink text-white text-xs font-semibold hover:bg-bh-ink/90"
        >
          Try again
        </button>
        <button
          onClick={onClose}
          className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to search
        </button>
      </div>
    </div>
  );
}

function AnswerView({
  answer,
  question,
  onClose,
  onAskAnother,
}: {
  answer: AskAnswer;
  question: string;
  onClose: () => void;
  onAskAnother: () => void;
}) {
  const conf: Record<AskAnswer["confidence"], string> = {
    high: "bg-emerald-100 text-emerald-700 border-emerald-200",
    medium: "bg-sky-100 text-sky-700 border-sky-200",
    low: "bg-bh-orange-50 text-bh-orange-700 border-bh-orange-200/60",
  };
  return (
    <div className="px-5 py-5 space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold flex items-center gap-1.5">
          <SparkIcon /> Hawktress
        </div>
        <div className="text-sm text-slate-500 mt-1 italic">{question}</div>
      </div>
      <p className="text-sm leading-relaxed text-slate-800">{answer.answer}</p>
      {answer.citations.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
            Citations
          </div>
          <ul className="space-y-1">
            {answer.citations.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-slate-700">
                <span
                  className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    c.kind === "project"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : c.kind === "policy"
                        ? "bg-violet-50 text-violet-700 border-violet-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  {c.kind}
                </span>
                <span className="flex-1">
                  <span className="font-semibold">{c.ref}</span>
                  {c.note && <span className="text-slate-500"> · {c.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${conf[answer.confidence]}`}
        >
          {answer.confidence} confidence
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onAskAnother}
            className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ask another
          </button>
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-lg bg-bh-ink text-white text-xs font-semibold hover:bg-bh-ink/90"
          >
            Close
          </button>
        </div>
      </div>
      <p className="text-[10px] text-slate-400">
        AI-generated, awaiting human sign-off if applied to a client artifact. Suggest, never
        auto-apply.
      </p>
    </div>
  );
}

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 text-slate-400"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const ProjectIcon = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-4 h-4 ${active ? "text-bh-orange" : "text-slate-400"}`}
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M9 4v16" />
  </svg>
);

const SparkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5 text-bh-orange"
  >
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" />
  </svg>
);
