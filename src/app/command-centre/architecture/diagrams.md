# BuildHawk · Technical workflow map

Source for every diagram on the `/command-centre/architecture` page. Paste any block into Mermaid Live, GitHub markdown, Notion, or the Figma Mermaid plugin to reproduce or fork.

PRD reference: BuildHawk Technical PRD v1.0 §6 (system architecture), §7.1–7.7 (modules), §8 (data model), §9 (integrations).

The `agent` class (violet) marks non-deterministic LLM-backed components. Every agent call is governed by the Agent governance service and writes a hash-chained `agent_run` event to the immutable audit log alongside its structured output.

---

## 1. System architecture

End-to-end view: external sources, ingestion + ETL, write-path agent layer, Hawktress core, deterministic processing engines, read-path agent layer, director-facing surfaces. Cross-cutting concerns rendered alongside.

```mermaid
graph TB
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
  AUDWR -. logs every agent_run .-> AgentsR
```

---

## 2. Data lifecycle: from quote to flagged tile

A trade quote enters the workbench (after extraction and classification by the Intake and Normaliser agents) and ends up as a margin erosion flag with a pre-drafted rationale in the director's view, in under 15 minutes. Every step, including every agent run, writes a hash-chained entry to the immutable audit log.

```mermaid
sequenceDiagram
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
  H->>L: Append decision event
```

---

## 3. Tenant isolation + anonymisation boundary

The commercial moat. Each builder owns their raw project data. Aggregated benchmarks are stripped of identifiers and only released when sample size meets the threshold. The Anonymisation guard agent runs as a final check on every aggregated payload, blocking release when the re-identification risk score exceeds policy. Per-tenant Console copilots respect the same boundary at the agent layer.

```mermaid
graph LR
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
  C1 -. blocked .-x A2
```
