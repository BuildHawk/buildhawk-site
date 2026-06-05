"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  VARIATIONS_REGISTER,
  ALLIANCE_SUPPLIERS,
  GROUP_BUYS,
  type RegisterVariation,
  type AllianceSupplier,
} from "./data";
import {
  aggregateHawktress,
  buildReportsSnapshot,
  findBenchmark,
  type RawProjectLike,
} from "./_lib/aggregation";

/* shared formatters (kept local to avoid circular import) */
const fmtCurrency = (n: number, compact = false) => {
  const abs = Math.abs(n);
  let s: string;
  if (compact && abs >= 1_000_000) s = (n / 1_000_000).toFixed(2) + "M";
  else if (compact && abs >= 1_000) s = (n / 1_000).toFixed(0) + "k";
  else s = abs.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (n < 0 ? "-$" : "$") + s;
};
const fmtPct = (n: number, sign = false, digits = 1) =>
  (sign && n > 0 ? "+" : "") + n.toFixed(digits) + "%";

const SectionHeader = ({
  title,
  sub,
  badge,
  action,
}: {
  title: string;
  sub?: string;
  badge?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">{title}</h2>
        {badge && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-bh-orange-50 text-bh-orange-700 border border-bh-orange-200/60 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
    {action}
  </div>
);

/* ------------------------------------------------------------------
 * Variations register
 * ----------------------------------------------------------------- */

type VarFilter = "All" | "Pending" | "CA review" | "Approved" | "Rejected";

const VARIATION_STATUS_CLASS: Record<RegisterVariation["status"], string> = {
  Pending: "bg-bh-orange-50 text-bh-orange-700 border-bh-orange-200/60",
  "CA review": "bg-rose-50 text-rose-700 border-rose-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-slate-100 text-slate-600 border-slate-200",
};

export const VariationsRegister = () => {
  const [filter, setFilter] = useState<VarFilter>("All");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  const filtered = useMemo(
    () =>
      VARIATIONS_REGISTER.filter(
        (v) => (filter === "All" || v.status === filter) && (!showFlaggedOnly || v.flagged),
      ),
    [filter, showFlaggedOnly],
  );

  const counts = {
    All: VARIATIONS_REGISTER.length,
    Pending: VARIATIONS_REGISTER.filter((v) => v.status === "Pending").length,
    "CA review": VARIATIONS_REGISTER.filter((v) => v.status === "CA review").length,
    Approved: VARIATIONS_REGISTER.filter((v) => v.status === "Approved").length,
    Rejected: VARIATIONS_REGISTER.filter((v) => v.status === "Rejected").length,
  };

  const totals = VARIATIONS_REGISTER.reduce(
    (a, v) => {
      a.value += v.value;
      if (v.flagged) a.flagged += 1;
      if (v.status === "Approved") a.approved += v.value;
      return a;
    },
    { value: 0, flagged: 0, approved: 0 },
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Variation register</h1>
          <p className="text-sm text-slate-500 mt-1">
            Every variation across all active projects, with Hawktress 5% benchmark flagging and
            director approval audit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Variations YTD" value={String(VARIATIONS_REGISTER.length)} sub="Across 4 active projects" />
        <Stat label="Total value" value={fmtCurrency(totals.value)} sub="Pending + approved" />
        <Stat label="Approved YTD" value={fmtCurrency(totals.approved)} sub="Locked into contract" tone="good" />
        <Stat
          label="Flagged"
          value={String(totals.flagged)}
          sub="Above 5% regional threshold"
          tone={totals.flagged > 0 ? "bad" : "good"}
        />
      </div>

      <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)]">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
          {(["All", "Pending", "CA review", "Approved", "Rejected"] as VarFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                filter === f
                  ? "bg-bh-ink text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f}
              <span
                className={`ml-1.5 tabular-nums ${filter === f ? "text-white/70" : "text-slate-400"}`}
              >
                {counts[f]}
              </span>
            </button>
          ))}
          <label className="ml-auto inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showFlaggedOnly}
              onChange={(e) => setShowFlaggedOnly(e.target.checked)}
              className="rounded border-slate-300 text-bh-orange focus:ring-bh-orange"
            />
            Flagged only
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="text-left font-semibold px-5 py-3">Variation</th>
                <th className="text-left font-semibold px-3 py-3">Project</th>
                <th className="text-right font-semibold px-3 py-3">Value</th>
                <th className="text-right font-semibold px-3 py-3">vs benchmark</th>
                <th className="text-left font-semibold px-3 py-3">Status</th>
                <th className="text-left font-semibold px-3 py-3">Decision</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{v.scope}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {v.id} · submitted {v.submittedDate}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{v.project}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">
                    {fmtCurrency(v.value)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div
                      className={`text-xs font-semibold tabular-nums ${
                        v.flagged ? "text-rose-600" : v.deltaPct < 0 ? "text-emerald-600" : "text-slate-600"
                      }`}
                    >
                      {fmtPct(v.deltaPct, true)}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      avg {fmtCurrency(v.regionalAvg)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${VARIATION_STATUS_CLASS[v.status]}`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-500">
                    {v.decidedDate ? (
                      <>
                        <div className="tabular-nums">{v.decidedDate}</div>
                        <div className="text-slate-400">{v.decidedBy}</div>
                      </>
                    ) : (
                      <span className="text-slate-400">awaiting director</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Stat = ({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "bad";
}) => {
  const toneClass = {
    neutral: "text-slate-900",
    good: "text-emerald-600",
    bad: "text-rose-600",
  }[tone];
  return (
    <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </div>
      <div className={`mt-1 text-xl font-extrabold tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------
 * Procurement (Alliance suppliers + group buys)
 * ----------------------------------------------------------------- */

const SupplierCard = ({ s }: { s: AllianceSupplier }) => (
  <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-4 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-bold text-slate-900 truncate">{s.name}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {s.tradeCategory} · {s.primaryRegion}
        </div>
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
          s.tier === "Preferred"
            ? "bg-bh-orange text-white"
            : "bg-slate-100 text-slate-700 border border-slate-200"
        }`}
      >
        {s.tier}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          Score
        </div>
        <div className="text-base font-bold tabular-nums text-slate-900 mt-0.5">
          {s.performanceScore}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          vs bench
        </div>
        <div
          className={`text-base font-bold tabular-nums mt-0.5 ${
            s.pricingVsBenchmarkPct < 0 ? "text-emerald-600" : "text-slate-700"
          }`}
        >
          {fmtPct(s.pricingVsBenchmarkPct, true)}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          Recent
        </div>
        <div className="text-base font-bold tabular-nums text-slate-900 mt-0.5">
          {s.recentJobs}
        </div>
      </div>
    </div>
    {s.catalogueFreshnessDays !== null && (
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span>Catalogue refreshed</span>
        <span
          className={`font-semibold tabular-nums ${
            s.catalogueFreshnessDays <= 7 ? "text-emerald-600" : "text-bh-orange-700"
          }`}
        >
          {s.catalogueFreshnessDays}d ago
        </span>
      </div>
    )}
  </div>
);

export const ProcurementView = () => {
  const [tier, setTier] = useState<"All" | "Preferred" | "Listed">("All");
  const filtered = ALLIANCE_SUPPLIERS.filter((s) => tier === "All" || s.tier === tier);
  const totalSavings = GROUP_BUYS.reduce((a, g) => a + (g.status === "Settled" ? g.savingsValue : 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Procurement</h1>
        <p className="text-sm text-slate-500 mt-1">
          Alliance suppliers surfaced at the point of spend. Performance scored against the
          Hawktress 5% threshold. BuildHawk takes no procurement margin on group buys.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Alliance suppliers" value={String(ALLIANCE_SUPPLIERS.length)} sub="Active and verified" />
        <Stat
          label="Preferred-tier suppliers"
          value={String(ALLIANCE_SUPPLIERS.filter((s) => s.tier === "Preferred").length)}
          sub="With live catalogue"
        />
        <Stat
          label="Group buy savings · YTD"
          value={fmtCurrency(totalSavings)}
          sub="Passed through in full"
          tone="good"
        />
        <Stat
          label="Open group buys"
          value={String(GROUP_BUYS.filter((g) => g.status !== "Settled").length)}
          sub="Aggregating demand"
        />
      </div>

      <section>
        <SectionHeader
          title="Group procurement"
          sub="Aggregated demand across BuildHawk client builders. Savings pass through 100%."
          badge="Network"
        />
        <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="text-left font-semibold px-5 py-3">Scope</th>
                <th className="text-right font-semibold px-3 py-3">Builders</th>
                <th className="text-right font-semibold px-3 py-3">Volume</th>
                <th className="text-right font-semibold px-3 py-3">Savings</th>
                <th className="text-left font-semibold px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {GROUP_BUYS.map((g) => (
                <tr key={g.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{g.scope}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">{g.id}</div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">
                    {g.participatingBuilders}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                    {g.unitsAggregated} {g.unitLabel}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="text-sm font-bold tabular-nums text-emerald-600">
                      {fmtCurrency(g.savingsValue)}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      {fmtPct(g.savingsPct, true)} below market
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        g.status === "Settled"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : g.status === "Negotiating"
                            ? "bg-bh-orange-50 text-bh-orange-700 border-bh-orange-200/60"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {g.status}
                      {g.closesIn && <span className="text-slate-400">· {g.closesIn}</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Alliance suppliers"
          sub={`${filtered.length} of ${ALLIANCE_SUPPLIERS.length} surfaced at point of procurement`}
          action={
            <div className="flex items-center gap-1.5 text-xs">
              {(["All", "Preferred", "Listed"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    tier === t
                      ? "bg-bh-ink text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <SupplierCard key={s.id} s={s} />
          ))}
        </div>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------
 * Hawktress benchmark explorer (real overlay aggregation)
 * Aggregates awarded subs from saved workbooks into region × trade × type
 * benchmarks. No synthesis — empty state when no overlays exist.
 * ----------------------------------------------------------------- */

export const HawktressView = ({ projects }: { projects: RawProjectLike[] | null }) => {
  const dataset = useMemo(() => aggregateHawktress(projects), [projects]);

  const regions = dataset.regionsRepresented;
  const trades = dataset.tradesRepresented;
  const projectTypes = dataset.projectTypesRepresented;

  const [region, setRegion] = useState<string>(regions[0] ?? "");
  const [trade, setTrade] = useState<string>(trades[0] ?? "");
  const [projectType, setProjectType] = useState<string>(projectTypes[0] ?? "");

  // Keep selectors valid when the dataset shifts
  if (regions.length > 0 && !regions.includes(region)) {
    setRegion(regions[0]);
  }
  if (trades.length > 0 && !trades.includes(trade)) {
    setTrade(trades[0]);
  }
  if (projectTypes.length > 0 && !projectTypes.includes(projectType)) {
    setProjectType(projectTypes[0]);
  }

  const benchmark = region && trade && projectType
    ? findBenchmark(dataset, region, trade, projectType)
    : null;
  const insufficient = !benchmark || benchmark.sampleSize < 5;

  const empty = dataset.awardedDataPoints === 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-bh-orange" />
            Powered by Hawktress
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Benchmark explorer</h1>
          <p className="text-sm text-slate-500 mt-1">
            Region × trade × project-type benchmarks computed from awarded subcontracts on
            saved BuildHawk workbooks. Anonymous by builder. Insufficient-data response when
            sample drops below 5.
          </p>
        </div>
        <Link
          href="/command-centre/architecture"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View data architecture →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Data points"
          value={dataset.awardedDataPoints.toLocaleString("en-AU")}
          sub="Awarded subcontract lines"
        />
        <Stat
          label="Live projects feeding"
          value={String(dataset.projectsContributing)}
          sub={dataset.projectsContributing === 0 ? "Awaiting first workbook save" : "With awarded subs"}
        />
        <Stat
          label="Regions covered"
          value={String(dataset.regionsRepresented.length)}
          sub={dataset.regionsRepresented.length === 0 ? "—" : dataset.regionsRepresented.slice(0, 2).join(", ")}
        />
        <Stat
          label="Trade categories"
          value={String(dataset.tradesRepresented.length)}
          sub={dataset.tradesRepresented.length === 0 ? "—" : "Across saved workbooks"}
        />
      </div>

      {empty ? (
        <section className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-8 text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-bold">
            Awaiting data
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-2">No benchmarks yet</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Open any project, fill the workbook tabs (Quote compare, Awarded subs, Variations),
            and hit Save. The Hawktress benchmark dataset is built from awarded subcontracts at
            workbook-save time. Builder and supplier identifiers are stripped before storage.
          </p>
        </section>
      ) : (
        <section className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5">
          <SectionHeader
            title="Lookup a benchmark"
            sub="Pick a region, trade and project type. Result is the volume-weighted average across all saved workbooks."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select label="Region" value={region} onChange={setRegion} options={regions} />
            <Select label="Trade category" value={trade} onChange={setTrade} options={trades} />
            <Select
              label="Project type"
              value={projectType}
              onChange={setProjectType}
              options={projectTypes}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 bg-bh-ink rounded-lg p-5 text-white">
              <div className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                Benchmark result
              </div>
              {insufficient ? (
                <>
                  <div className="mt-3 text-xl font-bold">Insufficient data</div>
                  <div className="text-sm text-white/60 mt-1">
                    {benchmark
                      ? `Only ${benchmark.sampleSize} contribution${benchmark.sampleSize === 1 ? "" : "s"} for this combination. Need 5 to surface a benchmark.`
                      : "No awarded subs for this combination yet."}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-3 text-3xl font-extrabold tabular-nums">
                    {fmtCurrency(benchmark!.averageAwardedValue)}
                  </div>
                  <div className="text-xs text-white/60 mt-1">
                    Volume-weighted average · {benchmark!.contributingProjects} project
                    {benchmark!.contributingProjects === 1 ? "" : "s"}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                        Sample
                      </div>
                      <div className="text-lg font-bold tabular-nums mt-0.5">
                        {benchmark!.sampleSize}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                        Range
                      </div>
                      <div className="text-sm font-bold tabular-nums mt-0.5">
                        {fmtCurrency(benchmark!.minAwardedValue, true)} – {fmtCurrency(benchmark!.maxAwardedValue, true)}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Recent awarded subs
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Latest contributions across all builders
              </div>
              <div className="mt-3 space-y-2">
                {dataset.recentAwards.length === 0 ? (
                  <div className="text-sm text-slate-500 italic">No awards recorded yet.</div>
                ) : (
                  dataset.recentAwards.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 text-sm border-b border-slate-200/60 pb-1.5 last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{a.tradeSection}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {a.region}
                          {a.projectType ? ` · ${a.projectType}` : ""}
                          {a.awardDate ? ` · ${a.awardDate}` : ""}
                        </div>
                      </div>
                      <div className="tabular-nums font-bold text-slate-900 shrink-0">
                        {fmtCurrency(a.awardedValue, true)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {!empty && (
        <section>
          <SectionHeader
            title="All benchmark cells"
            sub={`${dataset.benchmarkCells.length} region × trade × type combination${dataset.benchmarkCells.length === 1 ? "" : "s"} on file. Cells with sample < 5 hide the average per anonymisation rules.`}
          />
          <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2">Region</th>
                  <th className="text-left px-3 py-2">Trade</th>
                  <th className="text-left px-3 py-2">Project type</th>
                  <th className="text-right px-3 py-2">Sample</th>
                  <th className="text-right px-3 py-2">Average</th>
                  <th className="text-right px-3 py-2">Range</th>
                </tr>
              </thead>
              <tbody>
                {dataset.benchmarkCells.map((c, i) => {
                  const show = c.sampleSize >= 5;
                  return (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2">{c.region}</td>
                      <td className="px-3 py-2">{c.trade}</td>
                      <td className="px-3 py-2">{c.projectType || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.sampleSize}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold">
                        {show ? fmtCurrency(c.averageAwardedValue, true) : <span className="text-slate-400">hidden</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {show ? (
                          <>
                            {fmtCurrency(c.minAwardedValue, true)} – {fmtCurrency(c.maxAwardedValue, true)}
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

const Select = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full bg-white border border-slate-300 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bh-orange focus:border-bh-orange"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
);

/* ------------------------------------------------------------------
 * Director reports — real-state snapshot
 * Reports are not yet shipping (the engine is on the roadmap). This view
 * surfaces the live readiness snapshot computed from saved overlays so
 * directors can see what the first monthly report will draw from.
 * ----------------------------------------------------------------- */

export const ReportsView = ({ projects }: { projects: RawProjectLike[] | null }) => {
  const snap = useMemo(() => buildReportsSnapshot(projects), [projects]);
  const empty = snap.projectsWithFinancials === 0;

  const formatIsoDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Director reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monthly report delivered on the 5th of each month. Pulls from saved workbooks plus
          live GHL state. The first report ships once the report engine is built; this view
          shows what it will be drawing from today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Reports delivered"
          value={String(snap.reportsDelivered)}
          sub={snap.reportsDelivered === 0 ? "Reporting engine on roadmap" : "Since engagement start"}
        />
        <Stat
          label="Next report scheduled"
          value={formatIsoDate(snap.nextReportIso)}
          sub="On the 5th of each month"
        />
        <Stat
          label="Blended net margin · live"
          value={snap.blendedNetMarginPct === null ? "—" : fmtPct(snap.blendedNetMarginPct)}
          sub={snap.blendedNetMarginPct === null ? "Awaiting workbook data" : "Across projects with financials entered"}
          tone={
            snap.blendedNetMarginPct === null
              ? "neutral"
              : snap.blendedNetMarginPct >= 15
                ? "good"
                : "bad"
          }
        />
        <Stat
          label="Open variations"
          value={String(snap.openVariations)}
          sub={`${snap.approvedVariations} approved this cycle`}
          tone={snap.openVariations > 0 ? "bad" : "good"}
        />
      </div>

      <section className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5">
        <SectionHeader
          title="Inputs the first report will draw from"
          sub="Real numbers from saved workbooks. Empty fields mean the workbook tab has not been filled yet."
        />
        <dl className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/70 pb-2">
            <dt className="text-slate-500">Projects with financial data</dt>
            <dd className="font-bold tabular-nums">{snap.projectsWithFinancials}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/70 pb-2">
            <dt className="text-slate-500">Total contract value</dt>
            <dd className="font-bold tabular-nums">
              {snap.totalContract > 0 ? fmtCurrency(snap.totalContract, true) : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/70 pb-2">
            <dt className="text-slate-500">Total forecast at completion</dt>
            <dd className="font-bold tabular-nums">
              {snap.totalForecastAtCompletion > 0
                ? fmtCurrency(snap.totalForecastAtCompletion, true)
                : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/70 pb-2">
            <dt className="text-slate-500">Last workbook save</dt>
            <dd className="font-medium text-slate-700 text-right">
              {snap.lastWorkbookSaveProject
                ? `${snap.lastWorkbookSaveProject} · ${formatIsoDate(snap.lastWorkbookSaveIso)}`
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {empty && (
        <section className="bg-bh-orange-50/60 border border-bh-orange-200/60 rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
            Awaiting first workbook
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            No saved financial data yet
          </h2>
          <p className="text-sm text-slate-700 mt-2 max-w-xl">
            Open a project and fill the Cost to complete, Awarded subs, Variations and Cashflow
            tabs. The director report draws every figure from these inputs; nothing is fabricated
            and nothing surfaces until a workbook is saved.
          </p>
        </section>
      )}

      <section>
        <SectionHeader
          title="Past reports"
          sub="The monthly report engine is on the Phase 1 roadmap. No reports have shipped yet."
        />
        <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-8 text-center text-sm text-slate-500">
          No reports yet. The first edition is scheduled for {formatIsoDate(snap.nextReportIso)}.
        </div>
      </section>
    </div>
  );
};
