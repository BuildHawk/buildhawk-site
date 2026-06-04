import { getMarkdownArticles } from "./markdown-articles";
import { getPublishedDbArticles } from "./db-articles";

// Articles published on /insights. Order does not matter; index sorts by date.
// Each article body uses a tiny markdown-like syntax handled by the renderer:
//   ## H2 heading
//   ### H3 heading
//   > pull quote
//   • bullet
//   --- (horizontal rule)
//   Plain paragraphs are paragraphs.
//
// File-based articles: drop a .md file into content/blog/ with the required
// frontmatter fields (slug, title, dek, authorId, date, readingTime, category,
// cover) and it will be merged at build time by getMarkdownArticles().

export type Author = {
  id: "nathan" | "jc";
  name: string;
  title: string;
};

export type Article = {
  slug: string;
  title: string;
  dek: string;
  authorId: Author["id"];
  date: string; // ISO yyyy-mm-dd
  readingTime: number; // minutes
  category: "Methodology" | "Field Notes" | "Founder" | "Operator Handbook";
  cover: string; // /images/...
  body: string;
  videoPoster?: string;
  videoLabel?: string;
  videoSrc?: string; // optional MP4 URL
  youtubeId?: string; // optional YouTube video ID
  videoCredit?: string; // e.g. "Featured talk · Will Spaulding"
};

export const authors: Record<Author["id"], Author> = {
  nathan: {
    id: "nathan",
    name: "Nathan Holloway",
    title: "Founder · BuildHawk and Hawktress",
  },
  jc: {
    id: "jc",
    name: "John Ceballos",
    title: "Head of Operations · BuildHawk",
  },
};

export const articles: Article[] = [
  {
    slug: "sitework-bore-hole-gap",
    title: "The geo-report gap: why sitework eats margin between bore holes",
    dek:
      "A geotechnical report tells you what is at three or four points on the site. Builders who price sitework as a locked sum are pricing those points as though they represent the entire allotment. The gap between bore holes is where margin disappears.",
    authorId: "nathan",
    date: "2026-05-06",
    readingTime: 5,
    category: "Operator Handbook",
    cover: "/brand/cover-sitework.svg?v=2",
    body: `Sitework kills more first-year margins than any other trade on the schedule. Not because builders are careless. Because sitework is the one stage where the ground decides what it costs, and the ground does not care what the estimate says.

The mistake is consistent: a builder prices sitework as a locked sum at tender, reviews the geotechnical report, and assumes the report tells the full story. They win the job. They mobilise. And somewhere between topsoil strip and slab prep, they hit conditions that the report never captured. Rock in a zone between bore holes. Unexpected fill in a corner of the site that was never tested. A perched water table that only reveals itself when excavation opens up the full footprint.

Every one of these is a cost the estimate did not carry. Every one of them comes off margin.

---

## Why the geo report is not the whole picture

A geotechnical report is a mandatory document. No building permit issues without one. The builder has it at tender, and they price sitework on the basis of what it says. That is the correct starting point. It is not a complete picture of what is in the ground.

A standard residential geotechnical investigation involves three to four bore holes across the site. Those bore holes produce accurate data at the exact point they were drilled. What they do not produce is certainty about every other point on the allotment. The ground between bore holes is interpolated, not tested. On a site with variable geology, fill of unknown origin, or a history of previous structures, the conditions between test points can be materially different from the conditions at them.

A builder who reads a geo report and locks sitework as a confirmed sum is pricing three to four data points as though they represent the entire site. In many cases that assumption holds. In enough cases it does not, and the cost of being wrong lands entirely on the builder's margin.

## Why year one is the highest-risk period

An experienced builder develops a calibrated sense of sitework exposure over time. They know which postcodes carry rock risk between bore holes. They know what variable fill looks like in a geo report and how to price around it. They have been caught out enough times that they have built a structural allowance for the unknown into their sitework approach.

A builder in their first year does not have that history. They read the geo report, price what it says, and trust the data. They are not yet pricing the gap between what the bore holes found and what the excavator might find. That gap is where the margin exposure lives.

## The spoil calculation builders get wrong

Spoil removal is one of the most consistently underpriced line items in residential sitework, and the error is almost always the same. The builder calculates the volume of material to be excavated, applies a truck rate, and puts a number in the estimate. What they do not account for is bulking.

Soil does not leave a site in the same volume it occupies in the ground. Clay bulks at 20 to 30%. Rock bulks at 30 to 40% or higher. On a standard residential allotment requiring 200 cubic metres of cut, a 25% bulk factor adds 50 cubic metres of material that was never in the disposal calculation. At a haulage and tipping rate of $120 per cubic metre, that is $6,000 unaccounted for before a single trade has raised a variation.

The compounding factor is contaminated or classified material. Standard fill goes to a standard landfill at a standard rate. Fill containing asbestos, hydrocarbons, or treated timber products is classified waste, running at three to five times the standard disposal rate. A geo report with three to four bore holes cannot confirm what is sitting in every untested zone. A builder who assumes standard disposal across the entire site is carrying both a financial and a regulatory risk inside the same unpriced line item.

On the wrong site, spoil is a $15,000 to $40,000 exposure sitting inside a number the builder never questioned.

## The correct position: allowance, not locked sum

Having a geotechnical report does not mean sitework should be priced as a locked sum. It means the builder has confirmed data at three to four points and interpreted data everywhere else.

Sitework at estimation stage should be structured as a base confirmed cost, derived from what the geo report actually establishes, plus an explicitly qualified provisional sum for the conditions the bore holes did not test. Not a vague contingency. A separately identified line item in the contract with a defined scope, a defined trigger, and a defined pricing mechanism if adverse conditions are encountered.

A locked sum transfers all geological risk, including the risk of what sits between the bore holes, to the builder the moment the contract is executed. If conditions are worse, the builder wears it. If conditions are better, the client keeps the saving. The asymmetry is entirely in the client's favour.

## The margin arithmetic on a missed sitework call

A builder prices sitework at $45,000 on an $850,000 contract. The geo report confirmed reactive clay at all four bore hole locations. Sitework is locked at tender on that basis.

Excavation commences. Rock is encountered at 600mm across 40% of the site, in a zone between two bore holes that both returned clay. Rock breaking and removal adds $28,000. Spoil volumes run 30% over estimate because bulking was not applied. Disposal adds a further $8,000. Total sitework cost lands at $81,000 against a $45,000 allowance. Variance: $36,000.

That $36,000 is unrecoverable. The geo report was in hand. The contract was signed on a locked sitework sum. There is no contractual mechanism to pass the cost to the client. It comes directly off the $212,500 margin target, reducing the effective margin from 25% to 20.3%.

On one project. Before the frame goes up.

## The upstream fix

Read the geo report for what it confirms, not what it implies. Data at bore hole locations is confirmed. Everything between those points is interpreted. Price accordingly.

Carry a provisional sum for inter-bore-hole risk on every site where geology is variable, fill history is unknown, or previous structures have been demolished.

Apply a bulk factor to every earthworks volume calculation. Minimum 20% for clay. Minimum 30% for rock. Confirm the rate with the excavator before finalising the disposal figure.

Obtain a current feature and level survey before finalising earthworks quantities. Planning-stage contour data is not a reliable basis for a cost.

Price rock separately and always. If the geo report shows rock at any bore hole location, carry a provisional sum for zones between test points with a day-rate mechanism for actual removal.

Review the dial-before-you-dig report at every tender. Service locations shift. An old report is not a reliable basis for a cost.

> The sitework stage is where the ground between the bore holes takes over. The builder's job is to price that uncertainty correctly before signing, not to discover it mid-excavation and absorb it in silence.

— BuildHawk`,
  },
  {
    slug: "variations-where-margin-dies",
    title: "Variations are where margin dies",
    dek:
      "Most builders do not lose their margin on the estimate. They lose it after the contract is signed, in the space between what was agreed and what actually gets built. One poorly managed variation register can wipe 8 to 12 points off margin before the roof is on.",
    authorId: "nathan",
    date: "2026-05-06",
    readingTime: 4,
    category: "Methodology",
    cover: "/brand/cover-variation.svg?v=2",
    body: `Most builders do not lose their margin on the estimate. They lose it after the contract is signed, in the space between what was agreed and what actually gets built.

Variations are not an inconvenience. They are the single highest-risk commercial event on any residential project. A builder running a 25% gross margin on a $1.2M contract has $300,000 to protect. One poorly managed variation register, three unpriced scope additions, and two "we'll sort it later" conversations with the client can wipe 8 to 12 points off that margin before the roof is even on.

This is not a niche problem. It is the default outcome when variation control is left to goodwill, verbal agreements, or a builder who is too busy managing the site to manage the contract.

---

## Where the leakage happens

Variations fail at four consistent points:

Scope is instructed verbally and never formalised. The client asks, the supervisor says yes, the trade does the work. No written instruction. No priced variation. No signature.

The variation is priced too late. Work is complete before the cost has been agreed. The builder presents a number after the fact and the client disputes it, citing their own (lower) expectation.

Preliminaries are not re-costed. A scope addition adds two weeks to the programme. The direct cost of the variation is captured. The additional site supervision, crane hire, scaffold, and temporary services are not.

Margin is not applied consistently. Trade quotes are passed through at cost. The builder recovers the supply and install but forfeits the margin they are entitled to on every instructed variation.

Each of these is a systems failure, not a one-off mistake.

## The standard that protects 25%

A variation that protects margin requires four non-negotiable steps before any work is instructed:

Written scope description with reference to the original contract scope and the specific change.

Full cost build-up: supply, install, preliminaries impact, and programme extension if applicable.

Margin applied at the same rate as the head contract.

Client signature before work commences. No exceptions.

The Security of Payment Act (SOPA in Victoria, BCIPA in Queensland) provides builders with a legal pathway to recover progress payments including variation amounts, but only where the variation is documented. A verbal instruction does not create an enforceable claim. A signed variation order does.

## The margin arithmetic builders ignore

On a $1.2M contract at 25% gross margin, the builder is recovering $300,000 above direct costs. If $80,000 in variations are instructed across the build and only $60,000 is formally claimed and collected, the margin on that $80,000 of work is effectively zero. The direct cost was covered. The margin was not.

Across a programme of ten projects per year, that leakage compounds. Five projects where variation recovery is partial or late does not mean a builder is a poor estimator. It means they have a variation control problem, and no estimate will fix it.

## What a controlled variation register looks like

Every live project should carry a variation register that tracks, at minimum:

• Variation number (sequential, no gaps)
• Date instructed (establishes timeline for Security of Payment purposes)
• Description (scope of change, referenced to contract)
• Direct cost ex-GST (supply and install)
• Preliminaries impact (additional site costs attributable to the variation)
• Margin applied (at head contract rate)
• Total value ex-GST (claimed amount)
• Client signature date (approval confirmation)
• Invoice issued (date and reference)
• Payment received (confirmed date)

This is not a bureaucratic exercise. It is a real-time snapshot of the commercial exposure on every project. Without it, the builder is managing margin from memory.

## The upstream fix

The most effective variation control starts before the contract is signed. A well-structured estimate with clearly defined scope and explicit contract exclusions reduces variation disputes at the source. When the original scope is unambiguous, the variation is unambiguous.

Builders who treat the estimate as a price submission and nothing else are leaving their margin unprotected from day one. The estimate is a contract document. It should be built accordingly.

## The position to hold

Variation control is not about being difficult with clients. It is about running a business with commercial discipline.

A client who understands that variations are priced, approved, and invoiced consistently will not be surprised when a scope change carries a cost. The builder who holds the line, consistently and professionally, protects the 25%. The builder who gives ground on variation process to keep the client happy will not have the margin to stay in business long enough to build them anything.

> The 25% does not die on the estimate. It dies on the variations the builder did not enforce.

— BuildHawk`,
  },
  {
    slug: "five-percent-variance-threshold",
    title: "The 5% Variance Rule: zero tolerance starts at contract",
    dek:
      "Every estimate carries uncertainty. The question is not whether variance exists, it is whether the builder controls it or absorbs it. Up to 5% per line item is acceptable at estimate stage. At contract execution, the tolerance is zero.",
    authorId: "nathan",
    date: "2026-05-06",
    readingTime: 4,
    category: "Methodology",
    cover: "/brand/cover-five-percent.svg?v=2",
    body: `Every estimate carries uncertainty. The question is not whether variance exists, it is whether the builder controls it or absorbs it.

The 5% Variance Rule is a commercial discipline applied at the estimation stage. It acknowledges that during cost planning, before a full document set is confirmed, before trade quotes are locked, and before site conditions are fully known, a tolerance of up to 5% on any individual line item is acceptable. It is not a buffer to hide poor estimating. It is a structured acknowledgement that estimate-stage figures carry inherent exposure, and that exposure must be named, tracked, and closed before a contract is executed.

Once the contract is signed, the tolerance is zero. The number is the number.

---

## What the 5% tolerance covers

At the estimation stage, variance arises from four sources:

Incomplete documentation. A full drawing set has not been issued. Scope is interpreted from what is available. Missing detail creates cost uncertainty.

Unconfirmed trade pricing. Budget rates or historical benchmarks have been used in lieu of live quotes. Market movement between estimate and tender close has not yet been captured.

Site conditions not yet assessed. Geotechnical data, service locations, or access constraints are unknown or assumed. These carry cost implications that cannot be fully quantified at estimate stage.

Scope interpretation. Where plans are ambiguous, the estimator makes a reasonable assumption. That assumption may not align with what the client or designer intended.

A 5% tolerance across these items, applied at the line-item level and flagged in the estimate, is a defensible commercial position. It communicates to the client that the figure is a considered estimate, not a fixed price, and that the path to a fixed price runs through confirmed documentation and trade quotes.

## What the 5% tolerance does not cover

The 5% tolerance is not a margin top-up. It is not a contingency for poor scope definition, missing trades from the estimate, or items that were simply not priced. Those are estimating errors. The 5% rule is a precision tool, not a catch-all.

Applying the tolerance to every line item regardless of confidence level is not discipline. It is padding. Builders who pad uniformly train clients to expect the final number to be lower, which creates exactly the commercial pressure the rule is designed to prevent.

The tolerance should be applied selectively, documented explicitly, and closed out at each stage gate as information improves.

## The gate that removes the tolerance

The 5% tolerance has a hard expiry: contract execution.

At the point of signing, every line item must be confirmed. Trade quotes must be in hand or formally committed. Scope must be locked to the issued tender documentation. Any item still carrying an estimate-stage tolerance that has not been resolved represents uncontrolled exposure that the builder is now carrying at their own risk.

The contract is a fixed-price commitment. The client signs on the basis of a number. The builder signs on the basis of a cost plan that must support a 25% gross margin at that number. If variance still exists inside the cost plan when the contract executes, the margin is already under threat before the first slab is poured.

Zero tolerance at contract stage is not a policy preference. It is a financial requirement.

## The margin arithmetic

A builder contracts a $950,000 project at 25% gross margin. Their direct cost target is $712,500. If three cost plan line items are still carrying a combined 5% estimate-stage tolerance at the time of signing, and those items total $180,000 of direct cost, the unresolved variance is $9,000. That $9,000 comes directly off margin if the costs land high.

On a project where the margin target is $237,500, a $9,000 exposure from unresolved estimate variance represents a 3.8% margin erosion before a single trade sets foot on site. Across a programme of eight to ten projects, this compounds into a structural margin problem that no variation recovery process can fully offset.

The fix is upstream. Close the variance before the contract is signed.

## How to apply the rule in practice

The 5% Variance Rule works as a staged close-out process tied to document milestones:

• Concept estimate (sketch plans or design intent only): up to 5% per line item, all items flagged.
• Schematic estimate (developed design, no engineering): up to 5% on structural and services items.
• Tender estimate (full drawing set, engineering issued): up to 5% on items pending trade quote only.
• Pre-contract sign-off (all trade quotes received and reviewed): zero. Every line item confirmed.
• Post-contract (contract executed): zero. No estimate-stage tolerances carried.

Each stage gate requires a formal review. Any item still carrying tolerance at the pre-contract stage must be resolved before execution, either by obtaining the outstanding quote, confirming the scope assumption with the designer, or adjusting the contract price to reflect the confirmed cost position.

## The discipline that protects the number

Builders who apply the 5% rule at estimate stage and enforce zero tolerance at contract stage are running cost plans, not guesses. They know their margin exposure at every point in the project lifecycle. They do not discover cost problems on site because the cost plan was never properly closed.

The estimate is the first commercial document on any project. The discipline applied to it determines whether the 25% margin is achievable or aspirational.

> BuildHawk's estimating framework is built around this principle. Every cost plan is produced with flagged tolerances, stage-gate review, and a pre-contract sign-off checklist designed to close every open item before execution. The number that goes into the contract is the number the builder can stand behind.

— BuildHawk`,
  },
  {
    slug: "underpricing-sitework-year-one",
    title: "Why every builder underprices sitework in a new region",
    dek:
      "Excavation, drainage, retaining and site clean. Together they are usually 4 to 7% of the contract. Builders almost universally get them wrong on the first job in a new region. Here is what to actually budget.",
    authorId: "nathan",
    date: "2024-10-08",
    readingTime: 6,
    category: "Operator Handbook",
    cover: "/brand/cover-sitework.svg?v=2",
    youtubeId: "bFloySBOcp8",
    videoLabel: "How to start a House Build in Australia · Pre-construction Guide",
    videoCredit: "Featured walkthrough · CourtneyBraz",
    body: `Sitework is the line item that ruins more first-region builds than any other. Frames are easy to estimate. Cabinetry is easy. Roofing is easy. Sitework is the one that hides.

I have worked across Geelong, the Bellarine Peninsula and the western Melbourne fringe for over two decades. Every time we open a job in a suburb we have not built in before, the first sitework estimate is wrong. Not by a small amount.

## What sitework actually contains

When estimators talk about sitework they usually mean four things bundled together:

• Bulk excavation and benching
• Stormwater and sewer connection works
• Retaining walls, where required by site fall
• Site clean and disposal at completion

In urban infill blocks across Melbourne and Geelong, these four items together usually run between 4% and 7% of the contract value on a custom home. On a knockdown rebuild the percentage is higher because of demolition, asbestos clearance and sometimes contaminated soil.

The trap is not the average. The trap is the variance between sites.

## Why the variance is so wide

Two blocks 800 metres apart can have wildly different sitework costs. The variables we have measured the most impact from:

**Site fall.** A 1-in-30 fall on a 600 m² block is benign. The same fall on a long narrow block over 35 metres becomes a retaining problem. The cost to retain a 1.2 metre cut runs $850 to $1,400 per linear metre depending on engineering and material choice. A 50-metre block with a 1.2 metre cut on one side is $42,000 to $70,000 of retaining alone.

**Soil class.** P-classified sites trigger engineered slabs and frequently engineered piers. A waffle pod slab on M-class costs around $98 per m² placed in 2024 prices in the Geelong region. The same footprint on P-class with bored piers can run $145 to $180 per m². On a 220 m² footprint that is $10,000 to $18,000 of unanticipated cost if you priced for M-class.

**Stormwater connection point distance.** Council-mandated connection point on a long block can mean 25 to 40 metres of stormwater pipe through landscaped or finished surface. At $120 to $180 per linear metre installed in tight access, the connection alone can be $3,000 to $7,000 over what you would have priced as a typical urban infill.

**Tree removal and protection.** Significant tree exclusion zones in the City of Greater Geelong and most metro councils require an arborist report and tree protection fencing through the entire build. A single retained tree adds $2,500 to $4,500 in protection costs and sometimes triggers a redesign of stormwater and excavation paths.

## The cost of getting it wrong

Sitework is almost always priced before the soil report and the survey come back. Builders use a per-m² rate that worked on the last job. The first job in a new suburb is usually wrong by between $8,000 and $35,000 against actuals. On a custom home with an 18% margin that is between half a percent and 2% of the entire contract margin, gone before the slab is poured.

The pattern is consistent across every region we have data on.

> The first job in a new suburb is the job you make mistakes on. The trick is to price it like you have already made them.

## What to do instead

We use a three-step process for any job in a region we have not previously built in.

**One.** Pull the sitework actuals from the closest comparable jobs we have, by build type and block size. If we have no closely comparable data we use the regional rolling average for the suburb if available.

**Two.** Add a regional unfamiliarity loading on the four sitework line items. The loading is 8% to 15% depending on how confident we are in the data set. The loading is visible to the client and explained in the assumption log.

**Three.** Caveat the sitework allowance in the contract until soil reports, surveys and council connection points are confirmed. The caveat language gives both sides the right to revise the sitework allowance based on actual site conditions before slab.

We have not lost a job to this loading. We have stopped losing margin to sitework.

## What the data shows

Across our last 24 months of completed jobs in the Geelong and western Melbourne regions, the average overrun on sitework on first-region jobs was 22% above the original allowance. The average overrun on second-and-subsequent jobs in the same region dropped to 6%.

The data tells you exactly what is happening. The first job you teach yourself the region. The second job you price the region.

The point of running a cost intelligence platform is to teach yourself the region before the first job, not after it.

---

If your business is moving into a new postcode this year, the single most expensive line item to get wrong is the one nobody pays attention to. Sitework is where margin disappears in November and reappears as a hard conversation in March. Price it like you already know what it costs. Then go and find out.`,
  },
  {
    slug: "variation-control-three-questions",
    title: "Variation Control: The System That Removes Discretion",
    dek:
      "A builder can price a job accurately, manage trades well, and still finish in the red. In most cases, the cause is the same: variations that were completed but never properly controlled.",
    authorId: "nathan",
    date: "2026-05-04",
    readingTime: 5,
    category: "Operator Handbook",
    cover: "/brand/cover-variation.svg?v=2",
    youtubeId: "qN8QOmChcxY",
    videoLabel: "Contract variation procedure with worked example",
    videoCredit: "Featured walkthrough · 26 min",
    body: `A builder can price a job accurately, manage trades well, and still finish in the red.

In most cases, the cause is the same: variations that were completed but never properly controlled.

Variations are not the problem. Scope changes on a custom home are inevitable. The problem is the system around them, or more accurately, the absence of one.

Most variation failures follow the same pattern. A client requests a change on site. The project manager agrees to proceed because the change seems minor or stopping work to process paperwork feels disproportionate. The trade completes the work. The cost gets absorbed into the job. At the end of the project, the builder reconciles the final account and finds the job is short by an amount that correlates almost exactly with the unprocessed variations from the previous six months.

The individual amounts rarely look significant in isolation. A $400 change to a tapware selection. An additional day of excavation after rock was struck. A revised balustrade detail that required custom fabrication. Separately, each one feels manageable. Cumulatively, across a $1.2 million project, they represent the difference between a healthy margin and a break-even job.

The second failure point is verbal approval. A client says yes on site. Work proceeds. The variation is never formalised in writing. At the end of the project, the client disputes the charge because they don't remember approving it, or because the final account is higher than expected and they are looking for items to challenge. Without a signed variation order, the builder has no position to stand on.

The third failure point is underpricing. A builder prices a variation quickly, without applying the same rigour used in the original estimate. Preliminaries are not added. Margin is forgotten. The variation is issued at cost. This happens most often on small variations where the builder wants to appear reasonable, and most expensively on large variations where the time pressure is highest.

A controlled variation process starts with one non-negotiable: no work proceeds on any change to contracted scope until a variation has been identified, priced, and submitted for approval. Not after. Not concurrently. Before.

The pricing step is where discipline matters most. A variation is priced the same way as the original estimate: labour, materials, plant, subcontractor costs, site overheads, and margin. Preliminaries are applied where the change extends the programme. Margin is applied at the same rate as the contract. A variation is not a favour. It is a commercial transaction.

Approval must be in writing before work proceeds. Verbal approval with nothing following it in writing is not a variation system. It is a dispute waiting to happen.

Variations should not be held and invoiced at Practical Completion as a lump sum. They should be invoiced progressively so the cash position of the project reflects actual cost at every stage. A builder who invoices $180,000 in unprocessed variations at the end of a job is not running a variation system. They are running a credit facility for their client, funded by their own cash flow.

A residential builder running ten custom homes a year, averaging $900,000 per contract, with a 12% margin target, needs to recover $108,000 per project to hit plan. On a project where $60,000 in variations were completed but not recovered, the margin drops to 5.3%. That is not a rounding error. It is a business model problem that compounds across every project where variation discipline is absent.

> The builders who run clean final accounts are not the ones who have fewer variations. They are the ones who process every variation the same way, every time, regardless of the relationship, the size of the change, or the pressure to keep work moving.

The system removes the discretion. That is precisely why it works.

— BuildHawk`,
  },
  {
    slug: "monthly-director-report-walkthrough",
    title: "Reading the Monthly Director Report: A Walkthrough",
    dek:
      "Every active job, every committed cost, every flagged variation, every dollar of cash position, in one report by the 5th of the month. Here is how to read it in 90 seconds and what to act on first.",
    authorId: "nathan",
    date: "2026-02-04",
    readingTime: 8,
    category: "Methodology",
    cover: "/brand/cover-director-report.svg?v=2",
    youtubeId: "42PcHNSOSEg",
    videoLabel: "Construction Cost Estimating · Step-by-step guide",
    videoCredit: "Featured walkthrough",
    body: `The monthly director report is the most important single artefact Hawktress produces. It runs to between three and seven pages depending on the size of the builder's active book. It lands in the director's inbox by the 5th of every month. Read correctly, it gives you 90 seconds of certainty about whether the business is on track.

This piece walks through how to read it.

## The structure

Every report has the same five sections in the same order.

**Section 1. Portfolio summary.** One page. Total contracted revenue, total revenue received this period, total committed costs, portfolio gross margin, cash position relative to project commitments and 30 / 60 / 90-day forecast revenue.

**Section 2. Job tracking grid.** One row per active job. Original contract value, current contract value, committed costs, forecast final cost, gross margin forecast, variations approved this month, programme status and an alert column.

**Section 3. Flagged items.** Every line that triggered the 5% variance threshold across every active job in the previous month, with current status.

**Section 4. Aged debtors and outstanding invoices.** Anything over 30 days, with the contact you need to chase.

**Section 5. Escalation items.** Any decision that requires director sign-off before the CA can proceed in the next 14 days.

## How to read it in 90 seconds

Every director who onboards onto the platform gets the same instruction from me. Read the report in this order, with a stopwatch.

**0 to 15 seconds.** Read section 1 only. Look at three numbers. Portfolio gross margin. Cash position relative to commitments. 30-day forecast revenue. If those three numbers are inside the bands you set at the start of the year, the business is on track and you can read the rest at your own pace. If any of the three are outside the band, you have a real meeting to run this morning.

**15 to 45 seconds.** Read section 2's alert column only. Anything red, anything amber. Skip the body of the grid. The alert column is engineered to be the first thing a director's eye lands on. If the alert column is clean, every job is tracking. If it is not, you know which jobs need a phone call before the day starts.

**45 to 75 seconds.** Read section 3's status column. Approved with note. Pushed back. Awaiting director decision. The "awaiting director decision" rows are the ones that block the CA from moving forward. They are the highest-leverage 30 seconds of your week.

**75 to 90 seconds.** Read section 5. These are the items that need your decision in the next 14 days. They are pre-formatted with the question, the recommendation from the CA and the option set. Most of them can be approved or actioned in under a minute each.

The other pages are for context. The first 90 seconds is for action.

> The report is engineered around a director who has 90 seconds and a director who has 90 minutes. Both have to be able to use it.

## What the alert column actually flags

The alert column has four possible states.

**Green.** Job is inside all forecast bands.

**Amber.** Job has at least one metric drifting toward a band edge but no breach yet. Common amber triggers: forecast final cost rising more than 2% in a single month, programme slippage of more than 5 working days against the contracted PC date, an unapproved variation backlog of more than five items or aged debtors on this job over 30 days.

**Red.** At least one metric has breached a band. Common red triggers: gross margin forecast dropped below the floor set at contract award, forecast final cost exceeding current contract value, programme slippage of more than 15 working days or a variation flagged outside the 5% threshold and unresolved for more than 14 days.

**Black.** Catastrophic. Job has a margin forecast below break-even, an unrecoverable cost overrun or a programme breach that triggers liquidated damages. These are escalated by the CA before the report goes out.

If you only ever read the alert column, you will catch every problem.

## The report is also a behaviour-shaping artefact

This is the part most directors miss when they first come on board. The report is not just a status snapshot. It is a behaviour-shaping artefact for the entire team that touches the jobs.

The estimator knows that any quote outside the 5% threshold will appear in section 3 with their name on it. They estimate tighter.

The CA knows that any unapproved variation backlog over five items will turn the alert column amber. They clear variations weekly.

The site team knows that any programme slippage over five days will turn amber and over fifteen days will turn red. They flag programme risk early instead of hiding it.

The director knows that any decision they have not made within 14 days will roll forward into section 5 of next month's report and be highlighted. They make decisions on time.

The report is the operating cadence of the business. It is also the document that proves the operating cadence is being held.

## The 5th of the month is non-negotiable

Reports issued on the 12th are reports nobody reads. The discipline of the 5th-of-the-month deadline is the discipline that keeps the report relevant. If your CA cannot produce the report by the 5th, the operating system upstream of the CA is broken. Fix that before you fix anything else.

## What to look for in your first three reports

If you are new to Hawktress and the report has just landed for the first time, look for three things.

**One.** Are the numbers in section 1 the numbers you expected? If they are not, your forecasts were wrong, which is fine, you now have data. Calibrate.

**Two.** Are the alert states in section 2 consistent with your gut feel about each job? Where the alert disagrees with your gut, the alert is usually right.

**Three.** Are there flagged items in section 3 that you would have approved without question if they had not been flagged? If there are, that is the value of the threshold. Those are the items that would have eaten your margin invisibly. Make a note of which ones, why they were flagged and what you decided.

By the third monthly report, the rhythm is set. By the sixth, the report is your single most reliable source of truth about the business.

---

If you are a builder running a director-level dashboard right now from spreadsheets and gut feel, the difference between that and a structured monthly report is not technological. It is decision speed. Decisions made in 90 seconds with a structured report are different decisions from the ones made in 90 minutes wading through a spreadsheet.

Run the report on the 5th. Hold the structure. The business will follow.`,
  },
  {
    slug: "building-hawktress-builder-builds-software",
    title: "Hawktress: Cost Data That Actually Matters",
    dek:
      "The cost data that actually matters in construction has never lived in a software platform. It lives in completed jobs. Hawktress is an attempt to fix that.",
    authorId: "nathan",
    date: "2026-05-04",
    readingTime: 5,
    category: "Founder",
    cover: "/brand/cover-hawktress.svg?v=2",
    youtubeId: "cbCZbaIoBm4",
    videoLabel: "How To Estimate Jobs For Contractors · Estimating 101",
    videoCredit: "Featured talk · Will Spaulding",
    body: `The cost data that actually matters in construction has never lived in a software platform. It lives in completed jobs.

Hawktress is an attempt to fix that.

Every estimating platform in the market is built on the same premise: give builders a place to input numbers. The assumption is that builders already know what those numbers should be. For a first-time estimate on an unfamiliar build type, in a market you haven't priced in six months, that assumption is where margin starts to erode.

The problem is not that builders lack tools. It is that the tools lack real data.

Published cost guides, QS indices, and square metre rates are useful for feasibility. They are not useful for live estimating decisions. They are averages, smoothed across geographies, build types, and time periods that may no longer reflect current conditions. By the time that data is published, it is already historical.

The data that is actually reliable comes from one place: jobs that have been built and reconciled. What a concreter charged per square metre for a waffle pod slab in a specific postcode, in a specific month, with specific site conditions. What a joinery package cost for a 280m² custom home with stone benchtops, full-height cabinetry, and a butler's pantry. What the delta was between the estimated and actual cost, and why.

That data exists. It just has not been captured in a structured, queryable format. It sits in spreadsheets, in job files, in email threads, and in the memory of estimators who have priced enough work to develop a feel for what things actually cost. That feel is valuable. It does not scale, it does not transfer, and it disappears when a team member leaves.

Hawktress started as a simple question: what if every job we completed fed data back into the next estimate?

The answer was not to build another estimating platform. The answer was to build a cost intelligence layer that sits behind the estimate, pulling from reconciled project data to validate allowances before they are locked in. A reference database, not a workflow tool.

The architecture is straightforward. A record per trade package, per job, capturing estimated cost, actual cost, variance, postcode, build type, floor area, and completion date. Simple to input. Powerful to query.

The discipline was in what not to build. No dashboards before the data is dense enough to be meaningful. No automation before the input process is stable. Builders who build software the way they build houses, by starting with structure before finishes, end up with something that works.

In practice, an estimator pricing a structural steel package for a two-storey custom home in coastal Victoria can query Hawktress for comparable packages from the last twelve months and use the actual cost range to stress-test their allowance before the estimate is finalised. Not as a replacement for a trade quote. As a check against an allowance that might be sitting 8% below where the market has moved.

> That is the function. Not prediction. Not automation. A structured reference that reduces the gap between what an estimator thinks something costs and what a subcontractor is going to charge for it.

The value of the database compounds with every job that feeds it. At fifty reconciled projects, it is a useful reference. At five hundred, it becomes a pricing intelligence asset that no published cost guide can replicate, because no published cost guide is built from the jobs you actually built.

For now, Hawktress is how BuildHawk makes the next estimate more accurate than the last one.

— BuildHawk`,
  },
];

// Priority: DB articles > markdown files > hardcoded. Same slug = higher wins.
async function getAllArticles(): Promise<Article[]> {
  const [mdArticles, dbArticles] = await Promise.all([
    Promise.resolve(getMarkdownArticles()),
    getPublishedDbArticles(),
  ]);
  const dbSlugs = new Set(dbArticles.map((a) => a.slug));
  const mdSlugs = new Set(mdArticles.map((a) => a.slug));
  return [
    ...articles.filter((a) => !mdSlugs.has(a.slug) && !dbSlugs.has(a.slug)),
    ...mdArticles.filter((a) => !dbSlugs.has(a.slug)),
    ...dbArticles,
  ];
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  return (await getAllArticles()).find((a) => a.slug === slug);
}

export async function getSortedArticles(): Promise<Article[]> {
  return (await getAllArticles()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getRelatedArticles(slug: string, count = 2): Promise<Article[]> {
  const all = await getAllArticles();
  const current = all.find((a) => a.slug === slug);
  if (!current) return [];
  return [...all]
    .filter((a) => a.slug !== slug)
    .sort((a, b) => {
      const aSameCat = a.category === current.category ? 0 : 1;
      const bSameCat = b.category === current.category ? 0 : 1;
      if (aSameCat !== bSameCat) return aSameCat - bSameCat;
      return a.date < b.date ? 1 : -1;
    })
    .slice(0, count);
}
