"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TENANT,
  PROJECTS,
  PENDING_VARIATIONS,
  EROSION_FLAGS,
  VARIANCE_BY_TRADE,
  CASHFLOW,
  TRADE_LINES,
  type Project,
  type CashflowPoint,
} from "./data";
import { VariationsRegister, ProcurementView, HawktressView, ReportsView } from "./views";
import type { RawProjectLike } from "./_lib/aggregation";
import GlassBackground from "./_components/GlassBackground";
import IntelligenceBrief from "./_components/IntelligenceBrief";
import CommandPalette from "./_components/CommandPalette";
import { TiltCard, FadeUp, useCountUp } from "./_components/motion";

/* ------------------------------------------------------------------
 * Utilities
 * ----------------------------------------------------------------- */

const fmtCurrency = (n: number, opts: { compact?: boolean; sign?: boolean } = {}) => {
  const { compact = false, sign = false } = opts;
  const abs = Math.abs(n);
  let s: string;
  if (compact && abs >= 1_000_000) s = (n / 1_000_000).toFixed(2) + "M";
  else if (compact && abs >= 1_000) s = (n / 1_000).toFixed(0) + "k";
  else s = abs.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const prefix = n < 0 ? "-$" : sign ? "+$" : "$";
  return prefix + s;
};

const fmtPct = (n: number, opts: { sign?: boolean; digits?: number } = {}) => {
  const { sign = false, digits = 1 } = opts;
  const v = n.toFixed(digits);
  if (sign && n > 0) return "+" + v + "%";
  return v + "%";
};

const projectMarginPosition = (p: Project) => p.budget * (p.liveMargin / 100);

const computeAggregate = (
  projects: Project[],
  cashflow: CashflowPoint[],
  cashflowIsReal: boolean,
) => {
  const totalBudget = projects.reduce((a, p) => a + p.budget, 0) || 1;
  const totalCommitted = projects.reduce((a, p) => a + p.committed, 0);
  const totalInvoiced = projects.reduce((a, p) => a + p.invoiced, 0);
  const totalMarginValue = projects.reduce((a, p) => a + projectMarginPosition(p), 0);
  const blendedMarginPct = (totalMarginValue / totalBudget) * 100;
  const targetBlended =
    (projects.reduce((a, p) => a + (p.budget * p.targetMargin) / 100, 0) / totalBudget) * 100;
  const projectsWithFinancials = projects.filter((p) => p.hasFinancialData).length;
  return {
    totalBudget,
    totalCommitted,
    totalInvoiced,
    totalMarginValue,
    blendedMarginPct,
    targetBlended,
    wipBilled: totalInvoiced,
    wipUnbilled: totalCommitted - totalInvoiced,
    netCash90: cashflowIsReal ? cashflow[cashflow.length - 1].balance - cashflow[0].balance : 0,
    projectsWithFinancials,
    portfolioHasFinancials: projectsWithFinancials > 0,
    cashflowIsReal,
  };
};

/* ------------------------------------------------------------------
 * Icons (inline SVG)
 * ----------------------------------------------------------------- */

type IconName =
  | "hawk"
  | "gauge"
  | "projects"
  | "variations"
  | "procurement"
  | "data"
  | "reports"
  | "settings"
  | "bell"
  | "search"
  | "flag"
  | "trend-up"
  | "trend-down"
  | "check"
  | "chevron-right"
  | "chevron-left"
  | "arrow-up-right"
  | "clock"
  | "refresh"
  | "info"
  | "building"
  | "menu"
  | "close";

const Icon = ({ name, className = "w-5 h-5" }: { name: IconName; className?: string }) => {
  const props = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    className,
  };
  switch (name) {
    case "hawk":
      return (
        <svg {...props}>
          <path d="M3 11l9-7 9 7-3 1-2 6H8l-2-6-3-1z" />
          <path d="M9 16l3-3 3 3" />
        </svg>
      );
    case "gauge":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 12l4-3" />
          <path d="M8 19a6 6 0 1 1 8 0" />
        </svg>
      );
    case "projects":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M9 4v16" />
        </svg>
      );
    case "variations":
      return (
        <svg {...props}>
          <path d="M4 6h13l3 3-3 3H4z" />
          <path d="M20 18H7l-3-3 3-3" />
        </svg>
      );
    case "procurement":
      return (
        <svg {...props}>
          <path d="M3 6h2l2 12h11l2-9H7" />
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
      );
    case "data":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </svg>
      );
    case "reports":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.8a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.5a7 7 0 0 0-2 1.2l-2.3-.8-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.8a7 7 0 0 0 2 1.2L10 21h4l.6-2.5a7 7 0 0 0 2-1.2l2.3.8 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
        </svg>
      );
    case "bell":
      return (
        <svg {...props}>
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "flag":
      return (
        <svg {...props}>
          <path d="M5 21V4h11l-2 4 2 4H5" />
        </svg>
      );
    case "trend-up":
      return (
        <svg {...props}>
          <path d="m4 17 6-6 4 4 6-8" />
          <path d="M14 7h6v6" />
        </svg>
      );
    case "trend-down":
      return (
        <svg {...props}>
          <path d="m4 7 6 6 4-4 6 8" />
          <path d="M14 17h6v-6" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="m5 12 5 5L20 7" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...props}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...props}>
          <path d="m15 6-6 6 6 6" />
        </svg>
      );
    case "arrow-up-right":
      return (
        <svg {...props}>
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      );
    case "info":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 8v.01" />
        </svg>
      );
    case "building":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="1" />
          <path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01M10 21v-4h4v4" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case "close":
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6l-12 12" />
        </svg>
      );
    default:
      return null;
  }
};

/* ------------------------------------------------------------------
 * Chrome
 * ----------------------------------------------------------------- */

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <Image
      src="/brand/emblem-bh-dark.svg"
      alt="BuildHawk"
      width={36}
      height={28}
      priority
      className="block"
    />
    <div className="leading-tight">
      <div
        className="text-white font-semibold uppercase"
        style={{ fontSize: 13, letterSpacing: "0.04em" }}
      >
        BUILDHAWK
      </div>
      <div
        className="text-white/55 mt-0.5 uppercase"
        style={{ fontSize: 9, letterSpacing: "0.16em" }}
      >
        Powered by Hawktress<sup style={{ fontSize: "0.7em", marginLeft: "0.1em" }}>™</sup>
      </div>
    </div>
  </div>
);

type ViewId = "dashboard" | "projects" | "variations" | "procurement" | "hawktress" | "reports";

const Sidebar = ({
  active,
  onNavigate,
  pendingVariations,
  isOpen,
  onClose,
}: {
  active: ViewId;
  onNavigate: (v: ViewId) => void;
  pendingVariations: number;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const items: { id: ViewId; label: string; icon: IconName; badge?: number; accent?: boolean }[] = [
    { id: "dashboard", label: "Cost Plan", icon: "gauge" },
    { id: "projects", label: "Estimates", icon: "projects" },
    { id: "variations", label: "Variations", icon: "variations", badge: pendingVariations },
    { id: "procurement", label: "RFQ Console", icon: "procurement" },
    { id: "hawktress", label: "Hawktress", icon: "data", accent: true },
    { id: "reports", label: "Reports", icon: "reports" },
  ];
  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          aria-hidden="true"
        />
      )}
      <aside
        className={`w-64 shrink-0 text-white/85 flex flex-col fixed lg:static inset-y-0 left-0 z-40 transition-transform lg:transition-none border-r border-white/5 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background:
            "linear-gradient(180deg, rgba(11,18,32,0.85) 0%, rgba(11,18,32,0.7) 100%)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
        }}
      >
      <div className="px-5 py-4 border-b border-white/10">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onNavigate(it.id)}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
              active === it.id
                ? "bg-white/10 text-white"
                : "text-white/55 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className={it.accent ? "text-bh-orange" : ""}>
              <Icon name={it.icon} className="w-[18px] h-[18px]" />
            </span>
            <span className="flex-1 text-left font-medium">{it.label}</span>
            {it.badge ? (
              <span className="text-[10px] font-semibold bg-bh-orange text-white px-1.5 py-0.5 rounded tabular-nums">
                {it.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-white/10">
        <Link
          href="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/55 hover:text-white hover:bg-white/5"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[18px] h-[18px]"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span>buildhawk.com.au</span>
        </Link>
        <Link
          href="/command-centre/settings"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/55 hover:text-white hover:bg-white/5"
        >
          <Icon name="settings" className="w-[18px] h-[18px]" />
          <span>Settings</span>
        </Link>
        <Link
          href="/command-centre/architecture"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/55 hover:text-white hover:bg-white/5"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[18px] h-[18px]"
          >
            <path d="M3 3h18v18H3z" />
            <path d="M3 9h18M9 3v18" />
          </svg>
          <span>Architecture</span>
        </Link>
        <div className="mt-3 px-3 py-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold uppercase tracking-wider tabular-nums">
            <span className="relative inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </span>
            Live
          </div>
          <div className="mt-1 text-[11px] text-white/55 leading-snug">
            Buildxact, Xero and Hawktress synced {TENANT.lastSync}.
          </div>
        </div>
      </div>
      </aside>
    </>
  );
};

const TopBar = ({
  onBack,
  breadcrumb,
  onMenuToggle,
  onOpenPalette,
  userEmail,
}: {
  onBack: (() => void) | null;
  breadcrumb: string;
  onMenuToggle: () => void;
  onOpenPalette: () => void;
  userEmail?: string | null;
}) => {
  const initials = userEmail
    ? userEmail
        .split("@")[0]
        .split(/[\.\-_]/)
        .map((s) => s[0]?.toUpperCase())
        .join("")
        .slice(0, 2) || "·"
    : "NH";
  return (
    <header
      className="relative border-b border-white/40"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
        }}
      />
      <div className="h-14 px-4 sm:px-6 flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 grid place-items-center rounded-xl border border-white/60 bg-white/60 backdrop-blur text-slate-700 hover:bg-white shrink-0"
          aria-label="Open navigation"
        >
          <Icon name="menu" className="w-[18px] h-[18px]" />
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <Icon name="chevron-left" className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-900 truncate">{TENANT.name}</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-slate-500 truncate hidden sm:inline">{breadcrumb}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate hidden sm:block">
            ABN {TENANT.abn} · {TENANT.tier} · Region {TENANT.primaryRegion}
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden xl:flex items-center gap-2 px-3 h-9 rounded-xl border border-white/60 bg-white/50 backdrop-blur w-72 text-slate-500 text-sm hover:bg-white/75 transition"
          aria-label="Search or ask Hawktress"
        >
          <Icon name="search" className="w-4 h-4" />
          <span>Search estimates or ask Hawktress</span>
          <span className="ml-auto text-[10px] bg-white/80 border border-white/60 rounded px-1.5 py-0.5 text-slate-500 tabular-nums">
            ⌘K
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenPalette}
          className="xl:hidden w-9 h-9 grid place-items-center rounded-xl border border-white/60 bg-white/60 backdrop-blur text-slate-600 hover:bg-white shrink-0"
          aria-label="Search"
        >
          <Icon name="search" className="w-[18px] h-[18px]" />
        </button>
        <button className="relative w-9 h-9 grid place-items-center rounded-xl border border-white/60 bg-white/60 backdrop-blur text-slate-600 hover:bg-white shrink-0">
          <Icon name="bell" className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-bh-orange ring-2 ring-white" />
        </button>
        {userEmail && (
          <div
            className="hidden sm:flex items-center gap-2 px-2 pr-3 h-9 rounded-xl border border-white/60 backdrop-blur text-xs shrink-0"
            style={{ background: "rgba(255,255,255,0.6)" }}
          >
            <span className="w-7 h-7 rounded-lg bg-bh-ink text-white grid place-items-center font-semibold text-[10px]">
              {initials}
            </span>
            <span className="text-slate-700 max-w-[12rem] truncate">{userEmail}</span>
          </div>
        )}
        <form action="/api/command-centre/auth/logout" method="POST" className="shrink-0">
          <button
            type="submit"
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/60 backdrop-blur text-xs font-semibold text-slate-700 hover:bg-white"
            title={userEmail ? `Sign out ${userEmail}` : "Sign out"}
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
};

/* ------------------------------------------------------------------
 * KPI card
 * ----------------------------------------------------------------- */

type Tone = "neutral" | "good" | "warn" | "bad";

const KPI = ({
  label,
  value,
  numericValue,
  formatNumeric,
  sub,
  tone = "neutral",
  trend,
  trendValue,
  footer,
}: {
  label: string;
  value: string;
  numericValue?: number;
  formatNumeric?: (n: number) => string;
  sub?: string;
  tone?: Tone;
  trend?: "up" | "down";
  trendValue?: string;
  footer?: string;
}) => {
  const toneClass = {
    neutral: "text-slate-900",
    good: "text-emerald-600",
    warn: "text-bh-orange-700",
    bad: "text-rose-600",
  }[tone];
  const animated = useCountUp(numericValue ?? 0, 1100);
  const display =
    typeof numericValue === "number" && formatNumeric
      ? formatNumeric(animated)
      : value;
  return (
    <TiltCard
      intensity={5}
      className="rounded-2xl border border-white/50 p-5 flex flex-col relative overflow-hidden shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)]"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-5 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(80% 80% at 0% 0%, rgba(222,81,35,0.07), transparent 60%)",
        }}
      />
      <div className="relative flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          {label}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold tabular-nums ${
              trend === "up" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            <Icon name={trend === "up" ? "trend-up" : "trend-down"} className="w-3.5 h-3.5" />
            {trendValue}
          </div>
        )}
      </div>
      <div className={`relative mt-3 text-[28px] font-extrabold tracking-tight tabular-nums ${toneClass}`}>
        {display}
      </div>
      {sub && <div className="relative text-xs text-slate-500 mt-1">{sub}</div>}
      {footer && (
        <div className="relative mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          {footer}
        </div>
      )}
    </TiltCard>
  );
};

/* ------------------------------------------------------------------
 * Cashflow chart (hand-rolled SVG)
 * ----------------------------------------------------------------- */

const CashflowChart = ({ data }: { data: CashflowPoint[] }) => {
  const W = 720;
  const H = 220;
  const P = { t: 20, r: 20, b: 28, l: 56 };
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const balances = data.map((d) => d.balance);
  const min = Math.min(...balances) * 0.92;
  const max = Math.max(...balances) * 1.06;
  const x = (i: number) => P.l + (i / (data.length - 1)) * innerW;
  const y = (v: number) => P.t + (1 - (v - min) / (max - min)) * innerH;
  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(d.balance).toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${x(data.length - 1).toFixed(1)} ${P.t + innerH} L ${x(0).toFixed(1)} ${
    P.t + innerH
  } Z`;
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => min + t * (max - min));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]">
      <defs>
        <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DE5123" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#DE5123" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((v, i) => (
        <g key={i}>
          <line
            x1={P.l}
            x2={W - P.r}
            y1={y(v)}
            y2={y(v)}
            stroke="#E5E7EB"
            strokeDasharray="2 4"
          />
          <text
            x={P.l - 8}
            y={y(v) + 4}
            fontSize="10"
            textAnchor="end"
            fill="#94A3B8"
            className="tabular-nums"
          >
            ${(v / 1000).toFixed(0)}k
          </text>
        </g>
      ))}
      <path d={area} fill="url(#cf)" />
      <path
        d={path}
        fill="none"
        stroke="#DE5123"
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(d.balance)}
          r="3"
          fill="#DE5123"
          stroke="white"
          strokeWidth="1.5"
        />
      ))}
      {[0, 4, 8, 12].map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          fontSize="10"
          textAnchor="middle"
          fill="#64748B"
          className="tabular-nums"
        >
          {i === 0 ? "Today" : `W${i}`}
        </text>
      ))}
    </svg>
  );
};

/* ------------------------------------------------------------------
 * Helpers / pills
 * ----------------------------------------------------------------- */

const SectionHeader = ({
  title,
  sub,
  action,
  badge,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  badge?: string;
}) => (
  <div className="flex items-end justify-between mb-3">
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

const StatusPill = ({ status }: { status: Project["status"] }) => {
  const map: Record<Project["status"], string> = {
    "On track": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Margin erosion": "bg-rose-50 text-rose-700 border-rose-200",
    "Variation pending": "bg-bh-orange-50 text-bh-orange-700 border-bh-orange-200/60",
    "Awaiting data": "bg-slate-100/80 text-slate-600 border-slate-200",
  };
  const dot: Record<Project["status"], string> = {
    "On track": "bg-emerald-500",
    "Margin erosion": "bg-rose-500",
    "Variation pending": "bg-bh-orange",
    "Awaiting data": "bg-slate-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${map[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
};

const ProjectsTable = ({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (id: string) => void;
}) => (
  <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] overflow-hidden">
    <table className="w-full">
      <thead>
        <tr className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
          <th className="text-left font-semibold px-5 py-3">Estimate</th>
          <th className="text-left font-semibold px-3 py-3">Region</th>
          <th className="text-right font-semibold px-3 py-3">Budget</th>
          <th className="text-right font-semibold px-3 py-3">Committed</th>
          <th className="text-left font-semibold px-3 py-3 w-32">Progress</th>
          <th className="text-right font-semibold px-3 py-3">Live margin</th>
          <th className="text-left font-semibold px-3 py-3">Status</th>
          <th className="w-10" />
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => {
          const marginOff = p.liveMargin - p.targetMargin;
          return (
            <tr
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition"
            >
              <td className="px-5 py-3">
                <div className="font-semibold text-sm text-slate-900">{p.name}</div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {p.id} · {p.type}
                </div>
              </td>
              <td className="px-3 py-3 text-sm text-slate-700">{p.region}</td>
              <td className="px-3 py-3 text-sm text-right tabular-nums font-medium">
                {fmtCurrency(p.budget)}
              </td>
              <td className="px-3 py-3 text-sm text-right tabular-nums text-slate-700">
                {p.hasFinancialData ? fmtCurrency(p.committed) : <span className="text-slate-400">—</span>}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-700 rounded-full"
                      style={{ width: `${p.percentComplete}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 w-8 text-right tabular-nums">
                    {p.percentComplete}%
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-right">
                {p.hasFinancialData ? (
                  <>
                    <div
                      className={`text-sm font-semibold tabular-nums ${
                        marginOff < -2
                          ? "text-rose-600"
                          : marginOff < 0
                            ? "text-bh-orange-700"
                            : "text-emerald-600"
                      }`}
                    >
                      {fmtPct(p.liveMargin)}
                    </div>
                    <div
                      className={`text-[11px] tabular-nums ${
                        marginOff < 0 ? "text-rose-500" : "text-emerald-500"
                      }`}
                    >
                      {fmtPct(marginOff, { sign: true })} vs target
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-slate-400">—</div>
                    <div className="text-[11px] text-slate-400">Add data</div>
                  </>
                )}
              </td>
              <td className="px-3 py-3">
                <StatusPill status={p.status} />
              </td>
              <td className="px-3 py-3 text-slate-300">
                <Icon name="chevron-right" className="w-4 h-4" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/* ------------------------------------------------------------------
 * Dashboard view
 * ----------------------------------------------------------------- */

const Dashboard = ({
  onSelectProject,
  projects,
  cashflow,
  cashflowIsReal,
  dataSource,
  snapshotAt,
  aiConfigured,
}: {
  onSelectProject: (id: string) => void;
  projects: Project[];
  cashflow: CashflowPoint[];
  cashflowIsReal: boolean;
  dataSource: "live" | "snapshot" | "demo";
  snapshotAt?: string | null;
  aiConfigured: boolean;
}) => {
  const aggregate = useMemo(
    () => computeAggregate(projects, cashflow, cashflowIsReal),
    [projects, cashflow, cashflowIsReal],
  );
  // Snapshot mode shows real Homes by NH data — same empty-state treatment as live.
  // Only "demo" should still show the synthesised flags/variations/variance.
  const realData = dataSource !== "demo";
  const intelligencePayload = useMemo(
    () => ({
      builder: TENANT.name,
      region: TENANT.primaryRegion,
      projectCount: projects.length,
      totalContract: aggregate.totalBudget,
      totalCommitted: aggregate.totalCommitted,
      totalInvoiced: aggregate.totalInvoiced,
      blendedMargin: aggregate.blendedMarginPct,
      targetMargin: aggregate.targetBlended,
      debtor90Plus: 0,
      netCash90: aggregate.netCash90,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        region: p.region,
        type: p.type,
        budget: p.budget,
        committed: p.committed,
        invoiced: p.invoiced,
        percentComplete: p.percentComplete,
        liveMargin: p.liveMargin,
        targetMargin: p.targetMargin,
        status: p.status,
        flags: p.flags,
      })),
    }),
    [projects, aggregate],
  );
  return (
  <div className="p-5 sm:p-8 space-y-7">
    {/* Hero — generous breathing room, primary action gets full weight */}
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold tabular-nums">
          <span className="relative inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-bh-orange" />
            <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-bh-orange animate-ping opacity-60" />
          </span>
          {dataSource === "live"
            ? "Live · Hawktress · Cost intelligence"
            : "Demo data · Hawktress"}
        </div>
        <h1 className="mt-3 text-3xl sm:text-[34px] font-extrabold tracking-tight text-slate-900 leading-[1.05]">
          Cost Plan Console
        </h1>
        <p className="mt-2 text-sm sm:text-[15px] text-slate-500 leading-relaxed">
          Precision Estimating. Disciplined Delivery. Cost certainty before contract.
        </p>
      </div>
      {/* Action group — clear hierarchy: primary (orange filled), secondary (orange outline), tertiary (ghost) */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/command-centre/new-project"
          className="h-11 px-5 inline-flex items-center gap-2 rounded-[8px] bg-bh-orange-500 text-bh-paper text-[13px] font-medium tracking-[-0.005em] border border-bh-orange-500 hover:bg-bh-orange-700 hover:border-bh-orange-700 active:bg-bh-orange-900 active:border-bh-orange-900 transition-colors shadow-[0_8px_24px_-8px_rgba(222,81,35,0.55)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          New estimate
        </Link>
        <button
          type="button"
          className="h-11 px-4 inline-flex items-center gap-2 rounded-[8px] border border-bh-orange-500 text-bh-orange-500 bg-transparent text-[13px] font-medium tracking-[-0.005em] hover:bg-bh-orange-50 active:bg-bh-orange-200 active:text-bh-orange-900 transition-colors"
        >
          <Icon name="reports" className="w-[15px] h-[15px]" />
          Export report
        </button>
        <button
          type="button"
          className="h-11 px-3.5 inline-flex items-center gap-2 rounded-[8px] text-slate-700 hover:text-bh-orange-700 hover:bg-bh-orange-50 active:text-bh-orange-900 transition-colors text-[13px] font-medium tracking-[-0.005em]"
          aria-label="Refresh dashboard data"
        >
          <Icon name="refresh" className="w-[15px] h-[15px]" />
          Refresh
        </button>
      </div>
    </div>

    {dataSource === "live" && (
      <div className="rounded-xl border border-bh-success-200 bg-bh-success-50 px-4 py-3 text-xs text-bh-success-500 flex items-start gap-2">
        <span className="font-bold">Live · Hawktress connected.</span>
        <span className="text-slate-700">
          {projects.length} active engagement{projects.length === 1 ? "" : "s"} pulled directly
          from Homes by NH. New estimates and stage progressions surface within 60 seconds.
        </span>
      </div>
    )}
    {dataSource === "snapshot" && (
      <div className="rounded-xl border border-bh-orange-200 bg-bh-orange-50 px-4 py-3 text-xs text-bh-orange-700 flex items-start gap-2">
        <span className="font-bold">Real data · Snapshot from Homes by NH.</span>
        <span className="text-slate-700">
          Showing {projects.length} live engagement{projects.length === 1 ? "" : "s"} captured{" "}
          {snapshotAt ? new Date(snapshotAt).toLocaleDateString("en-AU") : "recently"}. For
          continuous sync of new estimates + stage progressions, set{" "}
          <code className="font-mono bg-white/80 border border-bh-orange-200 px-1 rounded">
            GHL_HBNH_API_KEY
          </code>{" "}
          in Vercel env.
        </span>
      </div>
    )}
    {dataSource === "demo" && (
      <div className="rounded-2xl border border-white/50 bg-white/55 backdrop-blur px-4 py-2.5 text-xs text-slate-700 flex items-start gap-2">
        <span className="font-bold">Demo mode.</span>
        <span>
          Illustrative data. Set <code className="font-mono bg-white/80 border border-white/60 px-1 rounded">GHL_HBNH_API_KEY</code> for live Homes by NH sync.
        </span>
      </div>
    )}

    {aiConfigured && (
      <FadeUp delay={120}>
        <IntelligenceBrief
          input={{ kind: "portfolio", payload: intelligencePayload }}
          context="Cost Plan brief"
        />
      </FadeUp>
    )}

    {/* KPIs */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI
        label="Live margin position"
        value={
          aggregate.portfolioHasFinancials
            ? fmtCurrency(aggregate.totalMarginValue, { compact: true })
            : "—"
        }
        numericValue={aggregate.portfolioHasFinancials ? aggregate.totalMarginValue : undefined}
        formatNumeric={(n) => fmtCurrency(n, { compact: true })}
        sub={
          aggregate.portfolioHasFinancials
            ? `${fmtPct(aggregate.blendedMarginPct)} blended · target ${fmtPct(aggregate.targetBlended)}`
            : "No estimate data entered yet"
        }
        tone={
          aggregate.portfolioHasFinancials
            ? aggregate.blendedMarginPct < aggregate.targetBlended
              ? "warn"
              : "good"
            : "neutral"
        }
        trend={
          aggregate.portfolioHasFinancials
            ? aggregate.blendedMarginPct < aggregate.targetBlended
              ? "down"
              : "up"
            : undefined
        }
        trendValue={
          aggregate.portfolioHasFinancials
            ? fmtPct(aggregate.blendedMarginPct - aggregate.targetBlended, { sign: true })
            : undefined
        }
        footer={`${projects.length} active engagement${projects.length === 1 ? "" : "s"} · ${fmtCurrency(aggregate.totalBudget, { compact: true })} under estimate`}
      />
      <KPI
        label="Committed cost"
        value={
          aggregate.portfolioHasFinancials
            ? fmtCurrency(aggregate.totalCommitted, { compact: true })
            : "—"
        }
        numericValue={aggregate.portfolioHasFinancials ? aggregate.totalCommitted : undefined}
        formatNumeric={(n) => fmtCurrency(n, { compact: true })}
        sub={
          aggregate.portfolioHasFinancials
            ? `${fmtCurrency(aggregate.wipBilled, { compact: true })} invoiced · ${fmtCurrency(aggregate.wipUnbilled, { compact: true })} unbilled`
            : "Enter via Estimate Workbook → Cost to complete"
        }
        footer={
          aggregate.portfolioHasFinancials
            ? "Cost-to-complete rollup · Xero invoiced to date"
            : "Buildxact + Xero connectors pending"
        }
      />
      <KPI
        label="Receivables 90+"
        value="—"
        sub="Xero connector required"
        tone="neutral"
        footer="Connect Xero to populate"
      />
      <KPI
        label="Net cash · next 90 days"
        value={
          aggregate.cashflowIsReal
            ? fmtCurrency(aggregate.netCash90, { compact: true, sign: true })
            : "—"
        }
        numericValue={aggregate.cashflowIsReal ? aggregate.netCash90 : undefined}
        formatNumeric={(n) => fmtCurrency(n, { compact: true, sign: true })}
        sub={
          aggregate.cashflowIsReal
            ? `Closing position ${fmtCurrency(cashflow[cashflow.length - 1].balance, { compact: true })}`
            : "No weekly cashflow entered yet"
        }
        tone={aggregate.cashflowIsReal && aggregate.netCash90 >= 0 ? "good" : "neutral"}
        trend={
          aggregate.cashflowIsReal ? (aggregate.netCash90 >= 0 ? "up" : "down") : undefined
        }
        footer={
          aggregate.cashflowIsReal
            ? "From per-estimate cashflow tabs"
            : "Estimate Workbook → Cashflow"
        }
      />
    </div>

    {/* Active estimates */}
    <section>
      <SectionHeader
        title="Active estimates"
        sub={
          realData
            ? `${dataSource === "live" ? "Live from" : "Snapshot from"} Homes by NH. Click any engagement for trade-level cost detail.`
            : "Click an engagement for committed cost, variations, and trade-level benchmarks."
        }
        action={
          <button className="text-sm font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
            View all <Icon name="chevron-right" className="w-3.5 h-3.5" />
          </button>
        }
      />
      <ProjectsTable projects={projects} onSelect={onSelectProject} />
    </section>

    {/* Cashflow + Flags */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5">
        <SectionHeader
          title="Cashflow forecast · 90 days"
          sub={
            cashflowIsReal
              ? "Aggregated from per-project Cashflow tabs."
              : "Open any estimate → Estimate Workbook → Cashflow to enter weekly inflows/outflows."
          }
          badge={cashflowIsReal ? "Live" : "Awaiting data"}
          action={
            <div className="flex items-center gap-1.5 text-[11px]">
              <button className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold tabular-nums">
                90D
              </button>
              <button className="px-2 py-1 rounded text-slate-400 hover:text-slate-700 tabular-nums">
                180D
              </button>
            </div>
          }
        />
        {cashflowIsReal ? (
          <CashflowChart data={cashflow} />
        ) : (
          <div className="h-[220px] flex flex-col items-center justify-center text-center px-6 rounded-xl border border-dashed border-slate-200 bg-white/40 text-slate-500">
            <div className="text-sm font-semibold text-slate-700">
              No weekly cashflow entered yet
            </div>
            <div className="mt-1 text-xs max-w-sm">
              Open any active project and add inflows/outflows on the Cashflow tab. The chart
              populates from real entries only.
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Inflows · 90d
            </div>
            <div className="text-base font-bold tabular-nums text-emerald-600 mt-0.5">
              {fmtCurrency(
                cashflow.reduce((a, d) => a + d.ar, 0),
                { compact: true },
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Outflows · 90d
            </div>
            <div className="text-base font-bold tabular-nums text-rose-600 mt-0.5">
              {fmtCurrency(
                cashflow.reduce((a, d) => a + d.ap, 0),
                { compact: true },
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Lowest forecast balance
            </div>
            <div className="text-base font-bold tabular-nums text-slate-900 mt-0.5">
              {fmtCurrency(Math.min(...cashflow.map((d) => d.balance)), { compact: true })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5 flex flex-col">
        <SectionHeader
          title="Margin erosion flags"
          sub={
            realData
              ? "Fires when committed cost or variations push live margin below target by 2%."
              : `${EROSION_FLAGS.length} live · review before director sign-off`
          }
          badge={realData ? "Awaiting data" : "Demo"}
        />
        {realData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 rounded-lg border border-dashed border-slate-200 bg-white/40 text-slate-500 min-h-[180px]">
            <div className="text-sm font-semibold text-slate-700">No flags raised</div>
            <div className="mt-1 text-xs max-w-xs">
              Flags appear once cost-to-complete and target margin are entered for a project.
            </div>
          </div>
        ) : (
        <div className="space-y-2.5 flex-1">
          {EROSION_FLAGS.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelectProject(f.projectId)}
              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{f.project}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{f.trigger}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-rose-600 tabular-nums">
                    {fmtPct(f.impactPct, { sign: true })}
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    {fmtCurrency(f.impactValue, { compact: true })}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 tabular-nums uppercase tracking-wider">
                <Icon name="clock" className="w-3 h-3" />
                <span>{f.ageHours}h ago</span>
                <span
                  className={`ml-auto px-1.5 py-0.5 rounded font-semibold ${
                    f.severity === "high"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-bh-orange-50 text-bh-orange-700"
                  }`}
                >
                  {f.severity.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
        )}
      </div>
    </div>

    {/* Variations + Variance */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5">
        <SectionHeader
          title="Open variations · director approval"
          sub={
            realData
              ? "Per-project Variations tab entries with director-pending status appear here."
              : `${PENDING_VARIATIONS.length} pending · 2 above regional benchmark`
          }
          badge={realData ? "Awaiting data" : undefined}
        />
        {realData ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white/40 text-slate-500 px-4 py-8 text-center text-sm">
            <div className="font-semibold text-slate-700">No variations pending director sign-off</div>
            <div className="mt-1 text-xs">
              Open a project, log a variation, set Director gate to <strong>Pending</strong>. It
              will surface here.
            </div>
          </div>
        ) : (
        <div className="-mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="text-left font-semibold px-5 py-2">Scope</th>
                <th className="text-right font-semibold px-3 py-2">Value</th>
                <th className="text-right font-semibold px-3 py-2">vs benchmark</th>
                <th className="text-right font-semibold pr-5 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {PENDING_VARIATIONS.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900 leading-tight">{v.scope}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                      {v.id} · {v.project} · {v.submittedDays}d ago
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">
                    {fmtCurrency(v.value)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
                        v.flagged
                          ? "text-rose-600"
                          : v.deltaPct < 0
                            ? "text-emerald-600"
                            : "text-slate-600"
                      }`}
                    >
                      {v.flagged && <Icon name="flag" className="w-3 h-3" />}
                      {fmtPct(v.deltaPct, { sign: true })}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      Regional avg {fmtCurrency(v.regionalAvg)}
                    </div>
                  </td>
                  <td className="pr-5 py-3 text-right">
                    <button
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        v.flagged
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {v.flagged ? "Review" : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5">
        <SectionHeader
          title="Quote vs actual variance"
          sub={
            realData
              ? "Computed from awarded quotes vs actuals across the Hawktress regional sample."
              : "By trade category, rolling 90 days, regional benchmark."
          }
          badge={realData ? "Awaiting data" : "Hawktress"}
        />
        {realData ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white/40 text-slate-500 px-4 py-8 text-center text-sm">
            <div className="font-semibold text-slate-700">No trade variance available yet</div>
            <div className="mt-1 text-xs">
              Variance computes once awarded quotes + actual costs are logged on at least one
              project.
            </div>
          </div>
        ) : (
        <div className="space-y-2.5">
          {VARIANCE_BY_TRADE.map((t) => {
            const bar = Math.min(Math.abs(t.deltaPct) / 10, 1) * 100;
            return (
              <div key={t.trade}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {t.flagged ? (
                      <Icon name="flag" className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : (
                      <span className="w-3.5" />
                    )}
                    <span className="font-medium text-slate-900 truncate">{t.trade}</span>
                  </div>
                  <div
                    className={`text-sm font-bold tabular-nums ${
                      t.flagged
                        ? "text-rose-600"
                        : t.deltaPct < 0
                          ? "text-emerald-600"
                          : "text-slate-700"
                    }`}
                  >
                    {fmtPct(t.deltaPct, { sign: true })}
                  </div>
                </div>
                <div className="mt-1.5 ml-5 flex items-center gap-3">
                  <div className="relative h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300" />
                    <div
                      className={`absolute top-0 bottom-0 rounded-full ${
                        t.deltaPct < 0
                          ? "right-1/2 bg-emerald-500"
                          : t.flagged
                            ? "left-1/2 bg-rose-500"
                            : "left-1/2 bg-slate-400"
                      }`}
                      style={{ width: `${bar / 2}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 tabular-nums w-12 text-right">
                    n={t.samples}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <Icon name="info" className="w-3.5 h-3.5" />
          <span>
            5% threshold flags quotes ahead of approval. Anonymised against rolling regional
            sample.
          </span>
        </div>
      </div>
    </div>
  </div>
  );
};

/* ------------------------------------------------------------------
 * Project drill-down
 * ----------------------------------------------------------------- */

const ProjectView = ({
  project,
  projects,
  onSelectProject,
  aiConfigured,
}: {
  project: Project;
  projects: Project[];
  onBack: () => void;
  onSelectProject: (id: string) => void;
  aiConfigured: boolean;
}) => {
  const used = TRADE_LINES.filter((t) => !t.pending).reduce((a, t) => a + t.committed, 0);
  const totalBudget = TRADE_LINES.reduce((a, t) => a + t.budget, 0);
  const variations = PENDING_VARIATIONS.filter((v) => v.projectId === project.id);
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold tabular-nums">
              <span>{project.id}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{project.type}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{project.region}</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">{project.name}</h1>
            <div className="mt-2">
              <StatusPill status={project.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/command-centre/projects/${project.id}/edit`}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-bh-orange-200/60 bg-bh-orange-50 text-bh-orange-700 text-sm font-semibold hover:bg-bh-orange-100"
            >
              Estimate Workbook
            </Link>
            <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
              Open in Buildxact <Icon name="arrow-up-right" className="w-3.5 h-3.5" />
            </button>
            <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-bh-ink text-white text-sm font-medium hover:bg-bh-ink/90">
              Director sign-off
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-6 pt-6 border-t border-slate-100">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Contract value
            </div>
            <div className="text-lg font-extrabold tabular-nums mt-1">
              {fmtCurrency(project.budget)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Committed
            </div>
            <div className="text-lg font-extrabold tabular-nums mt-1">
              {fmtCurrency(project.committed)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {fmtPct((project.committed / project.budget) * 100)} of budget
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Invoiced
            </div>
            <div className="text-lg font-extrabold tabular-nums mt-1">
              {fmtCurrency(project.invoiced)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Live margin
            </div>
            <div
              className={`text-lg font-extrabold tabular-nums mt-1 ${
                project.liveMargin < project.targetMargin - 2
                  ? "text-rose-600"
                  : project.liveMargin < project.targetMargin
                    ? "text-bh-orange-700"
                    : "text-emerald-600"
              }`}
            >
              {fmtPct(project.liveMargin)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Target {fmtPct(project.targetMargin)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Schedule
            </div>
            <div className="text-lg font-extrabold tabular-nums mt-1">
              M{project.monthsElapsed}/M{project.durationMonths}
            </div>
            <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-700 rounded-full"
                style={{ width: `${project.percentComplete}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {aiConfigured && (
        <FadeUp delay={140}>
          <IntelligenceBrief
            input={{ kind: "project", id: project.id }}
            context={`Estimate brief · ${project.name}`}
          />
        </FadeUp>
      )}

      <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5">
        <SectionHeader
          title="Budget vs committed · by trade"
          sub="Variance against regional Hawktress benchmark, 5% threshold."
          badge="Hawktress"
        />
        <div className="space-y-3">
          {TRADE_LINES.map((t) => {
            const ratio = t.committed / t.budget;
            const over = ratio > 1;
            return (
              <div key={t.trade}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {t.flagged && <Icon name="flag" className="w-3.5 h-3.5 text-rose-500" />}
                    {t.pending && (
                      <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded tabular-nums">
                        RFQ open
                      </span>
                    )}
                    <span className="font-medium text-slate-900 truncate">{t.trade}</span>
                  </div>
                  <div className="flex items-center gap-4 tabular-nums shrink-0">
                    <span className="text-[11px] text-slate-500">
                      {fmtCurrency(t.committed, { compact: true })} /{" "}
                      {fmtCurrency(t.budget, { compact: true })}
                    </span>
                    {!t.pending && (
                      <span
                        className={`text-xs font-bold w-14 text-right ${
                          t.flagged
                            ? "text-rose-600"
                            : t.deltaPct < 0
                              ? "text-emerald-600"
                              : "text-slate-600"
                        }`}
                      >
                        {fmtPct(t.deltaPct, { sign: true })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${over ? "bg-rose-500" : "bg-emerald-500"}`}
                    style={{ width: `${(Math.min(ratio, 1.2) / 1.2) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 border-r-2 border-slate-700/40"
                    style={{ left: `${100 / 1.2}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Budget allocated</span>
            <div className="font-bold tabular-nums text-base mt-0.5">
              {fmtCurrency(totalBudget)}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Committed to date</span>
            <div className="font-bold tabular-nums text-base mt-0.5">{fmtCurrency(used)}</div>
          </div>
          <div>
            <span className="text-slate-500">Open RFQs</span>
            <div className="font-bold tabular-nums text-base mt-0.5">
              {TRADE_LINES.filter((t) => t.pending).length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5">
          <SectionHeader title="Variations on this project" sub={`${variations.length} pending`} />
          {variations.length === 0 && (
            <div className="text-sm text-slate-500 py-8 text-center">No open variations.</div>
          )}
          <div className="space-y-2.5">
            {variations.map((v) => (
              <div key={v.id} className="p-3 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{v.scope}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                      {v.id} · {v.submittedDays}d ago
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold tabular-nums text-sm">{fmtCurrency(v.value)}</div>
                    <div
                      className={`text-[11px] tabular-nums font-semibold ${
                        v.flagged ? "text-rose-600" : "text-slate-500"
                      }`}
                    >
                      {fmtPct(v.deltaPct, { sign: true })} vs benchmark
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`text-xs font-semibold px-2.5 py-1 rounded ${
                      v.flagged
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {v.flagged ? "Request CA review" : "Approve"}
                  </button>
                  <button className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200">
                    View detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5">
          <SectionHeader title="Other active projects" sub="Switch quickly across the portfolio." />
          <div className="space-y-2">
            {projects.filter((p) => p.id !== project.id).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left"
              >
                <div className="w-10 h-10 rounded-md bg-slate-100 grid place-items-center text-slate-500">
                  <Icon name="building" className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {p.region} · {p.type}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-bold tabular-nums ${
                      p.liveMargin < p.targetMargin - 2
                        ? "text-rose-600"
                        : p.liveMargin < p.targetMargin
                          ? "text-bh-orange-700"
                          : "text-emerald-600"
                    }`}
                  >
                    {fmtPct(p.liveMargin)}
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    {p.percentComplete}% complete
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------
 * App
 * ----------------------------------------------------------------- */

type Route = { view: ViewId | "project"; projectId: string | null };

type CommandCentreProps = {
  liveProjects: Project[] | null;
  liveCashflow?: CashflowPoint[] | null;
  rawProjects?: RawProjectLike[] | null;
  dataSource: "live" | "snapshot" | "demo";
  snapshotAt?: string | null;
  ghlConnected: boolean;
  aiConfigured?: boolean;
  userEmail?: string | null;
};

export default function CommandCentre({
  liveProjects,
  liveCashflow,
  rawProjects = null,
  dataSource,
  snapshotAt = null,
  aiConfigured = false,
  userEmail = null,
}: CommandCentreProps) {
  const projects: Project[] = liveProjects ?? PROJECTS;
  const cashflowIsReal = !!(liveCashflow && liveCashflow.length > 1);
  const cashflow = cashflowIsReal ? liveCashflow! : CASHFLOW;
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd+K / Ctrl+K opens the command palette anywhere in the app
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Aggregate intelligence payload reused across portfolio brief + AI ask
  const aggregateForPayload = useMemo(
    () => computeAggregate(projects, cashflow, cashflowIsReal),
    [projects, cashflow, cashflowIsReal],
  );
  const intelligencePayload = useMemo(
    () => ({
      builder: TENANT.name,
      region: TENANT.primaryRegion,
      projectCount: projects.length,
      totalContract: aggregateForPayload.totalBudget,
      totalCommitted: aggregateForPayload.totalCommitted,
      totalInvoiced: aggregateForPayload.totalInvoiced,
      blendedMargin: aggregateForPayload.blendedMarginPct,
      targetMargin: aggregateForPayload.targetBlended,
      debtor90Plus: 0,
      netCash90: aggregateForPayload.netCash90,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        region: p.region,
        type: p.type,
        budget: p.budget,
        committed: p.committed,
        invoiced: p.invoiced,
        percentComplete: p.percentComplete,
        liveMargin: p.liveMargin,
        targetMargin: p.targetMargin,
        status: p.status,
        flags: p.flags,
      })),
    }),
    [projects, aggregateForPayload],
  );
  const [route, setRoute] = useState<Route>({ view: "dashboard", projectId: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectProject = (projectId: string) => {
    setRoute({ view: "project", projectId });
    setSidebarOpen(false);
  };
  const goDashboard = () => setRoute({ view: "dashboard", projectId: null });

  const navigate = (v: ViewId) => {
    setRoute({ view: v, projectId: null });
    setSidebarOpen(false);
  };

  const project = route.projectId
    ? projects.find((p) => p.id === route.projectId) ?? null
    : null;

  let breadcrumb = "Cost Plan Console";
  let onBack: (() => void) | null = null;
  let content: React.ReactNode = null;
  let activeNav: ViewId = "dashboard";

  if (route.view === "dashboard") {
    breadcrumb = "Cost Plan Console";
    content = (
      <Dashboard
        onSelectProject={selectProject}
        projects={projects}
        cashflow={cashflow}
        cashflowIsReal={cashflowIsReal}
        dataSource={dataSource}
        snapshotAt={snapshotAt}
        aiConfigured={aiConfigured}
      />
    );
    activeNav = "dashboard";
  } else if (route.view === "project" && project) {
    breadcrumb = `Cost Plan Console / ${project.name}`;
    onBack = goDashboard;
    content = (
      <ProjectView
        project={project}
        projects={projects}
        onBack={goDashboard}
        onSelectProject={selectProject}
        aiConfigured={aiConfigured}
      />
    );
    activeNav = "dashboard";
  } else if (route.view === "projects") {
    breadcrumb = "Projects";
    content = (
      <div className="p-4 sm:p-6">
        <ProjectsTable projects={projects} onSelect={selectProject} />
      </div>
    );
    activeNav = "projects";
  } else if (route.view === "variations") {
    breadcrumb = "Variations";
    activeNav = "variations";
    content = <VariationsRegister />;
  } else if (route.view === "procurement") {
    breadcrumb = "Procurement";
    activeNav = "procurement";
    content = <ProcurementView />;
  } else if (route.view === "hawktress") {
    breadcrumb = "Hawktress";
    activeNav = "hawktress";
    content = <HawktressView projects={rawProjects} />;
  } else if (route.view === "reports") {
    breadcrumb = "Reports";
    activeNav = "reports";
    content = <ReportsView projects={rawProjects} />;
  }

  return (
    <div className="h-screen flex text-slate-900 overflow-hidden relative">
      <GlassBackground tone="light" />
      <Sidebar
        active={activeNav}
        onNavigate={navigate}
        pendingVariations={PENDING_VARIATIONS.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0 relative z-0">
        <TopBar
          onBack={onBack}
          breadcrumb={breadcrumb}
          onMenuToggle={() => setSidebarOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          userEmail={userEmail}
        />
        <div className="flex-1 overflow-auto">{content}</div>
      </main>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        projects={projects}
        onSelectProject={selectProject}
        aiConfigured={aiConfigured}
        intelligencePayload={intelligencePayload}
      />
    </div>
  );
}
