# BuildHawk · Technical workflow map

Source for every diagram on the `/command-centre/architecture` page. Paste any block into Mermaid Live, GitHub markdown, Notion, or the Figma Mermaid plugin to reproduce or fork.

PRD reference: BuildHawk Technical PRD v1.0 §6 (system architecture), §7.1–7.7 (modules), §8 (data model), §9 (integrations).

---

## 1. System architecture

End-to-end view: external sources, ingestion + ETL, Hawktress core, processing engines, director-facing surfaces. Cross-cutting concerns rendered alongside.

```mermaid
graph TB
  classDef src fill:#fff,stroke:#94A3B8,stroke-width:1.5px,color:#0F172A
  classDef ingest fill:#FFF8EB,stroke:#E89A1A,stroke-width:1.5px,color:#9A2A06
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
    NORM["Normaliser<br/>map to 33 trade categories<br/>map to 24 AU/NZ regions"]:::ingest
    AUDWR["Audit log writer<br/>append-only · hash-chained"]:::ingest
  end

  subgraph Core[" Hawktress core · Postgres · ap-southeast-2 "]
    PROJ[("Project tables<br/>tenant-scoped<br/>quotes · actuals · variations")]:::core
    AGG[("Aggregated views<br/>region × trade × type<br/>min sample 5 enforced")]:::core
    AUDIT[("Immutable audit log<br/>7yr retention")]:::core
  end

  subgraph Engines[" Processing engines "]
    BENCH["Benchmark engine<br/>rolling 12mo volume-weighted avg<br/>5% threshold · confidence score"]:::engine
    FLAGS["Margin + erosion engine<br/>real-time triggers"]:::engine
    PLACE["Procurement placement<br/>tier · region · performance"]:::engine
  end

  subgraph Surfaces[" Director-facing surfaces "]
    direction TB
    CC["Command Centre<br/>director dashboard"]:::surface
    SUB["Hawktress portal<br/>builder + trade subscribers"]:::surface
    ALL["Alliance console<br/>supplier procurement"]:::surface
  end

  subgraph Cross[" Cross-cutting "]
    direction LR
    AUTH["Auth · multi-tenant<br/>MFA enforced"]:::cross
    BILL["Stripe AU<br/>subscription tiers"]:::cross
    SPINE["GHL + Power Automate<br/>sales · onboarding · billing events"]:::cross
  end

  DX --> XR
  BX --> PULL
  XR --> PULL
  WB --> NORM
  PULL --> NORM
  NORM --> PROJ
  PROJ -. hourly recompute .-> AGG
  PROJ --> AUDWR
  AUDWR --> AUDIT
  AGG --> BENCH
  PROJ --> FLAGS
  AGG --> PLACE
  BENCH --> CC
  BENCH --> SUB
  BENCH --> ALL
  FLAGS --> CC
  PLACE --> ALL
  PROJ -. tenant-scoped reads .-> CC
  AUTH -. gate .-> Surfaces
  SPINE -. provisioning .-> AUTH
  BILL -. entitlement .-> AUTH
```

---

## 2. Data lifecycle: from quote to flagged tile

A trade quote enters the workbench and ends up as a margin erosion flag in the director's view, in under 15 minutes. Every step has an audit log entry.

```mermaid
sequenceDiagram
  autonumber
  actor E as Estimator
  participant W as RFQ Workbench
  participant N as Normaliser + Anonymiser
  participant H as Hawktress core
  participant L as Audit log
  participant B as Benchmark engine
  participant F as Flag engine
  actor D as Director

  E->>W: Enter quote<br/>(supplier, $42,800, scope)
  W->>W: Estimator sign-off
  W->>N: Quote committed
  N->>N: Tag region · trade · project type
  N->>H: Write tagged quote (tenant-scoped)
  H->>L: Append write event (hash-chained)
  H->>B: Trigger recompute<br/>(region × trade × type)
  B->>B: Update rolling 12mo avg<br/>recalculate confidence score
  B->>H: Persist new benchmark
  B->>F: Quote 7.3% above benchmark
  F->>D: Surface flag in Command Centre<br/>(SLA: under 15 minutes)
  D->>W: Director clicks "Request CA review"
  W->>L: Append decision event
```

---

## 3. Tenant isolation + anonymisation boundary

The commercial moat. Each builder owns their raw project data. Aggregated benchmarks are stripped of identifiers and only released when sample size meets the threshold. This is what stops Hawktress from being a generic data product anyone can audit.

```mermaid
graph LR
  classDef tenant fill:#fff,stroke:#0B1220,stroke-width:1.5px,color:#0B1220
  classDef raw fill:#FFF8EB,stroke:#E89A1A,color:#9A2A06
  classDef agg fill:#0B1220,stroke:#0B1220,color:#fff
  classDef pub fill:#fff,stroke:#DE5123,stroke-width:2px,color:#9A2A06
  classDef rule fill:#FEE2E2,stroke:#F87171,color:#991B1B,stroke-dasharray:4 3

  subgraph TA[" Builder A (Homes by NH) "]
    A1["Quote $42,800<br/>Northcote KDR · Framing"]:::raw
    A2["Director view A<br/>margin · cashflow · variations"]:::tenant
  end
  subgraph TB[" Builder B (anonymised) "]
    B1["Quote $39,200<br/>Project · Framing"]:::raw
    B2["Director view B"]:::tenant
  end
  subgraph TC[" Builder C (anonymised) "]
    C1["Quote $41,600<br/>Project · Framing"]:::raw
    C2["Director view C"]:::tenant
  end

  RULE["<b>Anonymisation rules</b><br/>strip project_id + builder_id<br/>require >=5 distinct projects<br/>aggregate at query layer"]:::rule

  AGG{{"Aggregation layer"}}:::agg
  PUB["Regional benchmark · Framing · NSW<br/>$41,200 avg · n=18 · conf 92%"]:::pub

  A1 -. write .-> AGG
  B1 -. write .-> AGG
  C1 -. write .-> AGG
  RULE -. enforces .-> AGG
  AGG --> PUB

  A1 ==> A2
  B1 ==> B2
  C1 ==> C2

  PUB -. shared anonymised benchmark .-> A2
  PUB -. shared anonymised benchmark .-> B2
  PUB -. shared anonymised benchmark .-> C2

  A1 -. blocked .-x B2
  A1 -. blocked .-x C2
  B1 -. blocked .-x A2
  C1 -. blocked .-x A2
```
