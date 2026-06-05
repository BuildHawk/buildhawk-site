import type { Metadata } from "next";
import CommandCentre from "./CommandCentre";
import { getActiveProjects, isGhlConnected, type HbnhProject } from "@/lib/ghl-homesbynh";
import { isAiConfigured } from "@/lib/intelligence";
import { getActiveContext, getSessionEmail } from "@/lib/auth";
import { getGhlConfig, getLegacyGhlConfig } from "@/lib/integrations";
import { getTenantAccess } from "@/lib/billing/access";
import BillingRequired from "./_components/BillingRequired";
import type { Project, CashflowPoint } from "./data";
import hbnhSnapshot from "./_data/hbnh-snapshot.json";

export const metadata: Metadata = {
  title: "Cost Plan Console · BuildHawk",
  description:
    "Pre-contract cost intelligence for residential builders. Live margin, committed cost, 90-day cashflow forecast, variation flags across active estimates.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "BuildHawk Cost Plan Console",
    description:
      "Precision Estimating. Disciplined Delivery. Live view of margin, cashflow and risk across active engagements.",
  },
};

// Force fresh GHL fetch on each request (no caching at the page level).
export const revalidate = 60;

const TEST_NAME_PATTERN = /\b(test|pressure test|sample|demo|placeholder)\b/i;

/**
 * Map a Homes by NH GHL project into the dashboard's Project shape.
 *
 * Real fields only — no synthesis. Fields with no source data are returned
 * as zero/empty so the UI can show "no data" rather than a fabricated value.
 *
 * Real-from-GHL: id, name, type, region, budget (monetaryValue), percentComplete (from stage).
 * Real-from-overlay (when user has saved data via the workbook editor):
 *   committed, invoiced, targetMargin, liveMargin, durationMonths, monthsElapsed, status.
 * Cost-to-complete rollup wins over explicit overlay numbers when entered.
 */
const toProject = (h: HbnhProject): Project => {
  const overlay = h.overlay ?? {};

  // Cost-to-complete rollups (real)
  const cccCommitted = (overlay.costToComplete ?? []).reduce(
    (a, l) => a + (l.committed ?? 0),
    0,
  );
  const cccSpent = (overlay.costToComplete ?? []).reduce(
    (a, l) => a + (l.spentToDate ?? 0),
    0,
  );
  const cccForecast = (overlay.costToComplete ?? []).reduce(
    (a, l) => a + (l.forecastAtCompletion ?? 0),
    0,
  );

  const committed = cccCommitted > 0 ? cccCommitted : (overlay.committed ?? 0);
  const invoiced = cccSpent > 0 ? cccSpent : (overlay.invoiced ?? 0);

  const targetMargin = overlay.targetMarginPct ?? 0;
  const liveMargin =
    overlay.liveMarginPct ??
    (cccForecast > 0 && h.budget > 0
      ? +(((h.budget - cccForecast) / h.budget) * 100).toFixed(1)
      : 0);

  const durationMonths =
    overlay.durationMonths ?? overlay.setup?.programmeMonths ?? 0;
  const percentComplete = overlay.percentComplete ?? h.percentComplete ?? 0;
  const monthsElapsed = overlay.monthsElapsed ?? 0;

  const hasFinancialData =
    committed > 0 ||
    invoiced > 0 ||
    targetMargin > 0 ||
    !!overlay.liveMarginPct ||
    cccCommitted > 0 ||
    cccSpent > 0;

  // Status: explicit overlay → variation gate → derived from GHL stage → Awaiting data
  let status: Project["status"];
  if (overlay.status) {
    status = overlay.status;
  } else {
    const openVariations = (overlay.variations ?? []).filter(
      (v) => v.directorGate === "Pending" || v.status === "Pending director",
    );
    if (openVariations.length > 0) status = "Variation pending";
    else if (h.derivedStatus === "Variation pending") status = "Variation pending";
    else if (hasFinancialData && targetMargin > 0 && liveMargin < targetMargin - 2)
      status = "Margin erosion";
    else if (hasFinancialData) status = "On track";
    else status = "Awaiting data";
  }

  return {
    id: h.id,
    name: h.name,
    type: h.type,
    region: h.region,
    budget: h.budget,
    committed,
    invoiced,
    percentComplete,
    targetMargin,
    liveMargin,
    status,
    flags: hasFinancialData && targetMargin > 0 && liveMargin < targetMargin - 1 ? 1 : 0,
    durationMonths,
    monthsElapsed,
    hasFinancialData,
  };
};

/**
 * Aggregate cashflow across all active projects' entered weekly forecasts.
 * Returns 12 weekly points starting from the tenant opening balance ($312k default),
 * or null if no project has any cashflow rows entered yet.
 */
const aggregateLiveCashflow = (
  rawProjects: HbnhProject[] | null,
  openingBalance = 312_000,
): CashflowPoint[] | null => {
  if (!rawProjects) return null;
  const weekTotals = new Map<number, { ar: number; ap: number }>();
  for (const p of rawProjects) {
    for (const row of p.overlay?.cashflow ?? []) {
      const wk = row.weekNumber;
      if (!wk || wk < 1 || wk > 13) continue;
      const ar =
        (row.inflowsProgressClaims ?? 0) +
        (row.inflowsRetention ?? 0) +
        (row.inflowsVariations ?? 0) +
        (row.inflowsOther ?? 0);
      const ap =
        (row.outflowsSubs ?? 0) +
        (row.outflowsMaterials ?? 0) +
        (row.outflowsOverheads ?? 0) +
        (row.outflowsOther ?? 0);
      const existing = weekTotals.get(wk) ?? { ar: 0, ap: 0 };
      weekTotals.set(wk, { ar: existing.ar + ar, ap: existing.ap - ap });
    }
  }
  if (weekTotals.size === 0) return null;
  const maxWeek = Math.min(12, Math.max(...Array.from(weekTotals.keys())));
  const points: CashflowPoint[] = [{ week: 0, balance: openingBalance, ar: 0, ap: 0 }];
  let bal = openingBalance;
  for (let w = 1; w <= maxWeek; w++) {
    const t = weekTotals.get(w) ?? { ar: 0, ap: 0 };
    bal += t.ar + t.ap;
    points.push({ week: w, balance: bal, ar: t.ar, ap: t.ap });
  }
  return points;
};

type SnapshotShape = {
  snapshotAt: string;
  source: string;
  projects: HbnhProject[];
};

const SNAPSHOT = hbnhSnapshot as SnapshotShape;

export default async function CommandCentrePage() {
  const ctx = await getActiveContext().catch(() => null);

  // Billing gate: if tenant is trial-expired / past-due / canceled, show the
  // billing-required page instead of the dashboard. /settings stays accessible
  // so they can manage billing.
  if (ctx) {
    const access = getTenantAccess(ctx.tenant);
    if (!access.allowed) {
      return (
        <BillingRequired
          tenant={{ name: ctx.tenant.name }}
          state={access.state}
          reason={access.reason}
        />
      );
    }
  }

  // Multi-tenant correctness: signed-in users only see their tenant's
  // integration. The env-var legacy fallback applies only when no session is
  // present (preview / snapshot / unauth render paths).
  const ghlConfig = ctx
    ? await getGhlConfig(ctx.tenant.id).catch(() => null)
    : getLegacyGhlConfig();
  const ghlConnected = isGhlConnected(ghlConfig);
  const ghlProjects = ghlConnected ? await getActiveProjects(ghlConfig) : null;

  let liveProjects: Project[] | null = null;
  let usableRaw: HbnhProject[] | null = null;
  let dataSource: "live" | "snapshot" | "demo" = "demo";
  let snapshotAt: string | null = null;

  if (ghlProjects && ghlProjects.length > 0) {
    // Path 1: continuous live GHL connection
    usableRaw = ghlProjects
      .filter((p) => p.budget >= 50_000)
      .filter((p) => !TEST_NAME_PATTERN.test(p.name))
      .filter((p) => p.derivedStatus !== "Completed");
    liveProjects = usableRaw.map(toProject);
    dataSource = "live";
  } else if (!ctx && SNAPSHOT.projects.length > 0) {
    // Path 2: legacy HBNH snapshot. Locked to unauth contexts only so the
    // snapshot's tenant data never leaks into a different tenant's dashboard.
    usableRaw = SNAPSHOT.projects
      .filter((p) => p.budget >= 50_000)
      .filter((p) => !TEST_NAME_PATTERN.test(p.name))
      .filter((p) => p.derivedStatus !== "Completed");
    liveProjects = usableRaw.map(toProject);
    dataSource = "snapshot";
    snapshotAt = SNAPSHOT.snapshotAt;
  }

  const liveCashflow = aggregateLiveCashflow(usableRaw);
  const aiConfigured = isAiConfigured();
  const userEmail = await getSessionEmail();

  // Pass the raw, overlay-bearing projects through so client views (Hawktress,
  // Reports) can aggregate from real workbook data without re-fetching.
  const rawProjects = usableRaw
    ? usableRaw.map((p) => ({
        id: p.id,
        name: p.name,
        region: p.region,
        type: p.type,
        budget: p.budget,
        overlay: p.overlay,
      }))
    : null;

  return (
    <CommandCentre
      liveProjects={liveProjects && liveProjects.length > 0 ? liveProjects : null}
      liveCashflow={liveCashflow}
      rawProjects={rawProjects}
      dataSource={dataSource}
      snapshotAt={snapshotAt}
      ghlConnected={ghlConnected}
      aiConfigured={aiConfigured}
      userEmail={userEmail}
    />
  );
}
