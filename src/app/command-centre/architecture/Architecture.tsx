"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ------------------------------------------------------------------
 * Mermaid sources (kept inline so this page is self-contained;
 * the canonical reference copy lives in ./diagrams.md)
 * ----------------------------------------------------------------- */

const ARCH = `graph TB
  classDef src fill:#fff,stroke:#94A3B8,stroke-width:1.5px,color:#0F172A
  classDef ingest fill:#FFF8EB,stroke:#E89A1A,stroke-width:1.5px,color:#9A2A06
  classDef agent fill:#F5F3FF,stroke:#7C3AED,stroke-width:1.5px,color:#4C1D95
  classDef core fill:#0B1220,stroke:#0B1220,color:#fff
  classDef engine fill:#fff,stroke:#DE5123,stroke-width:1.5px,color:#9A2A06
  classDef surface fill:#fff,stroke:#0B1220,stroke-width:2px,color:#0B1220
  classDef cross fill:#F1F5F9,stroke:#94A3B8,stroke-dasharray:4 3,color:#475569

  subgraph Sources[" External sources "]
    direction TB
    BX["Buildxact PM<br/>BOQ · RFQ · PO · variations"]:::src
    XR["Xero<br/>invoices · bills · debtor ageing"]:::src
    DX["Dext<br/>bills only, into Xero"]:::src
    WB["Estimator RFQ workbench<br/>email · phone · PDF quotes"]:::src
  end

  subgraph Ingest[" Ingestion + ETL "]
    direction TB
    PULL["Connectors<br/>Buildxact 15min + webhook<br/>Xero hourly + webhook"]:::ingest
    DOCQ["Document queue<br/>email · PDF · call transcripts"]:::ingest
    AUDWR["Audit log writer<br/>append-only · hash-chained"]:::ingest
  end

  subgraph AgentsW[" Agent layer · write path "]
    direction TB
    INTAKE["Intake agent<br/>extract supplier · lines · scope · exclusions"]:::agent
    NORMA["Normaliser agent<br/>33 trades · 24 regions · confidence score"]:::agent
    SCOPEA["Scope check agent<br/>vs historical comparables · gap warnings"]:::agent
  end

  subgraph Core[" Hawktress core · Postgres · ap-southeast-2 "]
    PROJ[("Project tables<br/>tenant-scoped<br/>quotes · actuals · variations")]:::core
    VEC[("Vector store<br/>tenant-namespaced embeddings")]:::core
    AGG[("Aggregated views<br/>region × trade × type<br/>min sample 5 enforced")]:::core
    AUDIT[("Immutable audit log<br/>7yr retention")]:::core
  end

  subgraph Engines[" Processing engines · deterministic "]
    BENCH["Benchmark engine<br/>rolling 12mo volume-weighted avg<br/>5% threshold · confidence score"]:::engine
    FLAGS["Margin + erosion engine<br/>real-time triggers"]:::engine
    PLACE["Procurement placement<br/>tier · region · performance"]:::engine
  end

  subgraph AgentsR[" Agent layer · read path "]
    direction TB
    EROS["Erosion explainer<br/>drafts the why for each flag"]:::agent
    COPI["Console copilot<br/>NL query · retrieval"]:::agent
    RANK["Procurement ranker<br/>ranked supplier list with rationale"]:::agent
    ANON["Anonymisation guard<br/>re-identification risk check"]:::agent
  end

  subgraph Surfaces[" Director-facing surfaces "]
    direction TB
    CC["Cost Plan Console<br/>director surface"]:::surface
    SUB["Hawktress portal<br/>builder + trade subscribers"]:::surface
    ALL["Alliance console<br/>supplier procurement"]:::surface
  end

  subgraph Cross[" Cross-cutting "]
    direction LR
    AUTH["Auth · multi-tenant<br/>MFA enforced"]:::cross
    BILL["Stripe AU<br/>billing infrastructure"]:::cross
    SPINE["GHL + Power Automate<br/>sales · onboarding · billing events"]:::cross
    GOV["Agent governance<br/>prompt registry · evals · kill switch"]:::cross
  end

  DX --> XR
  BX --> PULL
  XR --> PULL
  WB --> DOCQ
  PULL --> PROJ
  DOCQ --> INTAKE
  INTAKE --> NORMA
  NORMA --> SCOPEA
  SCOPEA --> PROJ
  PROJ -. hourly recompute .-> AGG
  PROJ --> VEC
  PROJ --> AUDWR
  AUDWR --> AUDIT
  AGG --> BENCH
  PROJ --> FLAGS
  AGG --> PLACE
  FLAGS --> EROS
  AGG --> COPI
  VEC --> COPI
  PLACE --> RANK
  AGG --> ANON
  EROS --> CC
  COPI --> CC
  BENCH --> CC
  BENCH --> SUB
  BENCH --> ALL
  RANK --> ALL
  PLACE --> ALL
  ANON --> SUB
  PROJ -. tenant-scoped reads .-> CC
  AUTH -. gate .-> Surfaces
  SPINE -. provisioning .-> AUTH
  BILL -. entitlement .-> AUTH
  GOV -. governs .-> AgentsW
  GOV -. governs .-> AgentsR
  AUDWR -. logs every agent_run .-> AgentsW
  AUDWR -. logs every agent_run .-> AgentsR`;

const LIFECYCLE = `sequenceDiagram
  autonumber
  actor Inbound as Inbound channel
  participant DocQ as Document queue
  participant Intake as Intake agent
  participant Norma as Normaliser agent
  participant Scope as Scope check agent
  actor E as Estimator
  participant H as Hawktress core
  participant L as Audit log
  participant B as Benchmark engine
  participant F as Margin + erosion engine
  participant Eros as Erosion explainer
  actor D as Director

  Inbound->>DocQ: Email, PDF, or call transcript
  DocQ->>Intake: Process document
  Intake->>Intake: Extract supplier · lines · scope · exclusions
  Intake->>L: Append agent_run event
  Intake->>Norma: Draft quote
  Norma->>Norma: Tag region · trade · type<br/>(confidence score)
  Norma->>L: Append agent_run event
  Norma->>Scope: Tagged draft
  Scope->>Scope: Compare to historical comparables
  Scope->>L: Append agent_run event
  Scope->>E: Draft + warnings in RFQ Workbench
  E->>E: Review · edit · sign off
  E->>H: Commit quote (tenant-scoped)
  H->>L: Append write event (hash-chained)
  H->>B: Trigger recompute<br/>(region × trade × type)
  B->>B: Update rolling 12mo avg<br/>recalculate confidence score
  B->>H: Persist new benchmark
  B->>F: Quote 7.3% above benchmark
  F->>Eros: Request rationale
  Eros->>Eros: Draft why<br/>(regional trend · supplier history · scope deltas)
  Eros->>L: Append agent_run event
  Eros->>D: Flag + pre-drafted rationale in Cost Plan Console<br/>(SLA: under 15 minutes)
  D->>H: Request CA review (rationale editable, attached)
  H->>L: Append decision event`;

const TENANT = `graph LR
  classDef tenant fill:#fff,stroke:#0B1220,stroke-width:1.5px,color:#0B1220
  classDef raw fill:#FFF8EB,stroke:#E89A1A,color:#9A2A06
  classDef agent fill:#F5F3FF,stroke:#7C3AED,stroke-width:1.5px,color:#4C1D95
  classDef agg fill:#0B1220,stroke:#0B1220,color:#fff
  classDef pub fill:#fff,stroke:#DE5123,stroke-width:2px,color:#9A2A06
  classDef rule fill:#FEE2E2,stroke:#F87171,color:#991B1B,stroke-dasharray:4 3

  subgraph TA[" Builder A (Homes by NH) "]
    A1["Quote $42,800<br/>Northcote KDR · Framing"]:::raw
    A2["Director view A<br/>margin · cashflow · variations"]:::tenant
    APA["Console copilot<br/>tenant-scoped"]:::agent
  end
  subgraph TB[" Builder B (anonymised) "]
    B1["Quote $39,200<br/>Project · Framing"]:::raw
    B2["Director view B"]:::tenant
    APB["Console copilot<br/>tenant-scoped"]:::agent
  end
  subgraph TC[" Builder C (anonymised) "]
    C1["Quote $41,600<br/>Project · Framing"]:::raw
    C2["Director view C"]:::tenant
    APC["Console copilot<br/>tenant-scoped"]:::agent
  end

  RULE["<b>Anonymisation rules</b><br/>strip project_id + builder_id<br/>require >=5 distinct projects<br/>aggregate at query layer"]:::rule
  GUARD["<b>Anonymisation guard agent</b><br/>re-identification risk score<br/>blocks release on risk"]:::agent

  AGG{{"Aggregation layer"}}:::agg
  PUB["Regional benchmark · Framing · NSW<br/>$41,200 avg · n=18 · conf 92%"]:::pub

  A1 -. write .-> AGG
  B1 -. write .-> AGG
  C1 -. write .-> AGG
  RULE -. enforces .-> AGG
  AGG --> GUARD
  GUARD --> PUB

  A1 ==> A2
  B1 ==> B2
  C1 ==> C2

  APA -. respects boundary .-> A2
  APB -. respects boundary .-> B2
  APC -. respects boundary .-> C2

  PUB -. shared anonymised benchmark .-> A2
  PUB -. shared anonymised benchmark .-> B2
  PUB -. shared anonymised benchmark .-> C2

  A1 -. blocked .-x B2
  A1 -. blocked .-x C2
  B1 -. blocked .-x A2
  C1 -. blocked .-x A2`;

/* ------------------------------------------------------------------
 * Mermaid (bundled, dynamic-imported on mount)
 * ----------------------------------------------------------------- */

const THEME = {
  startOnLoad: false,
  theme: "base" as const,
  themeVariables: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "13px",
    primaryColor: "#fff",
    primaryTextColor: "#0F172A",
    primaryBorderColor: "#0B1220",
    lineColor: "#64748B",
    tertiaryColor: "#F8FAFC",
    actorBkg: "#0B1220",
    actorTextColor: "#fff",
    actorLineColor: "#0B1220",
    signalColor: "#0B1220",
    signalTextColor: "#0B1220",
    labelBoxBkgColor: "#FFF8EB",
    labelBoxBorderColor: "#E89A1A",
    noteBkgColor: "#FFF8EB",
    noteTextColor: "#9A2A06",
  },
};

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
const loadMermaid = () => {
  if (mermaidPromise) return mermaidPromise;
  mermaidPromise = import("mermaid").then((mod) => {
    mod.default.initialize(THEME);
    return mod.default;
  });
  return mermaidPromise;
};

let renderCounter = 0;

const Diagram = ({ source }: { source: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = await loadMermaid();
        if (cancelled || !ref.current) return;
        renderCounter += 1;
        const id = `mermaid-${renderCounter}`;
        const { svg } = await mermaid.render(id, source);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 overflow-hidden">
        <div className="p-4 bg-rose-50 text-rose-800 text-sm border-b border-rose-200 flex items-center justify-between gap-3">
          <span>
            Diagram render failed in your browser. Source shown below — paste into{" "}
            <a
              href="https://mermaid.live"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              mermaid.live
            </a>{" "}
            to view.
          </span>
          <button
            onClick={() => setShowSource((s) => !s)}
            className="shrink-0 text-xs font-semibold px-2 py-1 rounded bg-white border border-rose-300 hover:bg-rose-100"
          >
            {showSource ? "Hide source" : "Show source"}
          </button>
        </div>
        {showSource && (
          <pre className="p-4 text-xs text-slate-700 bg-slate-50 overflow-x-auto whitespace-pre">
            {source}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 overflow-x-auto">
      <div ref={ref} className="mermaid-target min-h-[200px] grid place-items-center text-slate-300">
        Rendering diagram…
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------
 * Page chrome
 * ----------------------------------------------------------------- */

const HawkEmblem = ({ size = 28 }: { size?: number }) => (
  <Image
    src="/brand/emblem-bh.svg"
    alt="BuildHawk"
    width={Math.round((size * 255.21) / 195.97)}
    height={size}
    priority
    className="block"
  />
);

const SectionTitle = ({
  num,
  title,
  sub,
}: {
  num: string;
  title: string;
  sub: string;
}) => (
  <div>
    <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
      {num}
    </div>
    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-slate-900">
      {title}
    </h2>
    <p className="mt-1.5 text-sm text-slate-600 max-w-3xl">{sub}</p>
  </div>
);

export default function Architecture() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href="/command-centre"
            className="flex items-center gap-2.5 group"
            aria-label="Back to Cost Plan Console"
          >
            <HawkEmblem size={28} />
            <div className="leading-tight">
              <div
                className="text-bh-black font-semibold uppercase"
                style={{ fontSize: 13, letterSpacing: "0.04em" }}
              >
                BUILDHAWK
              </div>
              <div
                className="text-bh-graphite mt-0.5 uppercase"
                style={{ fontSize: 9, letterSpacing: "0.16em" }}
              >
                Powered by Hawktress<sup style={{ fontSize: "0.7em", marginLeft: "0.1em" }}>™</sup>
              </div>
            </div>
          </Link>
          <div className="flex-1" />
          <Link
            href="/command-centre"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Open dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        <section>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-bh-orange" />
            Technical workflow · PRD v1.0 reference
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
            How data becomes margin control.
          </h1>
          <p className="mt-3 text-slate-600 max-w-3xl">
            Three views. The system as a whole, the lifecycle of a single quote, and the
            anonymisation boundary that protects every builder while letting the network sharpen
            the benchmark for everyone. An agent layer wraps the deterministic core (it never
            replaces it) so estimators stop retyping quotes and directors get a pre-drafted
            rationale on every flag.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <Stat label="Trade categories" value="33" />
            <Stat label="Regions covered" value="24" />
            <Stat label="Variance threshold" value="5%" />
            <Stat label="Min benchmark sample" value="5 projects" />
            <Stat label="Hosting" value="AWS Sydney" />
            <Stat label="Audit retention" value="7 years" />
            <Stat label="Write-path agents" value="3" />
            <Stat label="Read-path agents" value="4" />
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle
            num="01 · Architecture"
            title="System architecture"
            sub="External sources flow in through the ingestion layer, get pre-processed by a write-path agent layer (Intake, Normaliser, Scope check), and land in the Hawktress core. Three deterministic engines drive every director-facing surface, with a read-path agent layer (Erosion explainer, Console copilot, Procurement ranker, Anonymisation guard) wrapping them with reasoning and narrative. Cross-cutting concerns gate access and govern every agent call."
          />
          <Diagram source={ARCH} />
        </section>

        <section className="space-y-5">
          <SectionTitle
            num="02 · Lifecycle"
            title="From quote to flagged tile"
            sub="A trade quote arrives by email, PDF, or call transcript. The Intake, Normaliser, and Scope check agents pre-process it before the estimator signs off, and the Erosion explainer drafts the rationale that lands next to the flag in the director's view. End to end in under 15 minutes. Every agent run is hash-chained into the immutable audit log alongside the deterministic write events."
          />
          <Diagram source={LIFECYCLE} />
        </section>

        <section className="space-y-5">
          <SectionTitle
            num="03 · Boundary"
            title="Tenant isolation + anonymisation"
            sub="The commercial moat. Each builder owns their raw data. Aggregated benchmarks are stripped of identifiers and only released when the sample reaches the threshold. The Anonymisation guard agent runs as a final check on every aggregated payload, blocking release when the re-identification risk score exceeds policy. Per-tenant Console copilots respect the same boundary at the agent layer."
          />
          <Diagram source={TENANT} />
        </section>

        <section className="bg-bh-ink text-white rounded-xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-bh-orange-200 font-bold">
                For engineers
              </div>
              <h3 className="text-xl font-extrabold mt-1">Raw Mermaid sources</h3>
              <p className="mt-2 text-sm text-white/70 max-w-xl">
                Every diagram on this page lives as plain text in
                <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-white text-[11px]">
                  src/app/command-centre/architecture/diagrams.md
                </code>
                . Fork into Figma via the Mermaid plugin, paste into Notion, or extend the source
                in the engineering wiki.
              </p>
            </div>
            <Link
              href="/command-centre"
              className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-md bg-white text-bh-ink font-semibold text-sm hover:bg-slate-100"
            >
              Back to Cost Plan Console →
            </Link>
          </div>
        </section>

        <footer className="pt-4 pb-2 text-[11px] text-slate-400 tabular-nums">
          PRD reference: BuildHawk Technical PRD v1.0 §6 (architecture), §7.1–7.7 (modules), §8
          (data model), §9 (integrations).
        </footer>
      </main>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white border border-slate-200 rounded-md px-3 py-1.5">
    <span className="text-slate-500 mr-1.5">{label}</span>
    <span className="font-semibold text-slate-900 tabular-nums">{value}</span>
  </div>
);
