import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Builder Terms of Use · Hawktress · BuildHawk",
  description:
    "Terms of use for Hawktress Builder subscriptions. Issued by BuildHawk Pty Ltd.",
};

export default function BuilderTermsPage() {
  return (
    <LegalLayout
      eyebrow="Hawktress · Client-facing"
      title="Builder Terms of Use"
      version="v3.0"
      date="1 May 2026"
    >
      <h2>1. Agreement</h2>
      <p>
        These terms govern access to and use of the Hawktress platform by
        residential builders and construction companies (Builder) who subscribe
        through BuildHawk Pty Ltd (BuildHawk). By paying the onboarding fee and
        any subscription fee, the Builder agrees to be bound by these terms.
      </p>

      <h2>2. What Hawktress delivers</h2>
      <p>
        Hawktress provides cost intelligence and project execution support
        across seven connected stages of the builder&apos;s project lifecycle:
      </p>
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Function</th>
            <th>Hawktress role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. Estimating</td>
            <td>Trade quotes, BOQ, scope definition, RFQ management</td>
            <td>Captures all quote data. Flags costs outside 5% regional threshold before estimate is issued</td>
          </tr>
          <tr>
            <td>2. Pre-construction planning</td>
            <td>Feasibility validation, budget confirmation, procurement strategy, programme planning</td>
            <td>Delivers real market benchmarks to validate budget. Flags procurement risks. Locks margin position before contract signed</td>
          </tr>
          <tr>
            <td>3. Contract admin</td>
            <td>Variation control, PO tracking, cost commitments, subcontractor management</td>
            <td>Validates every variation claim against 5% threshold. Flags out-of-threshold variations for director approval. Tracks committed costs in real time</td>
          </tr>
          <tr>
            <td>4. Project execution</td>
            <td>Live cost tracking, supplier performance, programme versus actual delivery</td>
            <td>Monitors actual costs against committed values. Flags margin erosion. Tracks supplier delivery performance</td>
          </tr>
          <tr>
            <td>5. Practical completion</td>
            <td>Final cost reconciliation, defects liability period, handover</td>
            <td>Generates final cost report. Reconciles quote versus actual trade by trade and supplier by supplier</td>
          </tr>
          <tr>
            <td>6. Intelligence layer</td>
            <td>Data feeds back into the system</td>
            <td>Every completed job sharpens the benchmarks. The system gets more accurate with every project</td>
          </tr>
          <tr>
            <td>7. Reporting</td>
            <td>Monthly director report: job tracking and company financial snapshot</td>
            <td>Single report covering all active jobs, margin position, variations, committed costs, forecast revenue and business cash position</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Subscription pricing</h2>
      <h3>3.1 Onboarding fee</h3>
      <p>
        A one-off onboarding fee of <strong>$3,500 AUD (ex GST)</strong> is
        payable before onboarding commences. Non-refundable.
      </p>
      <h3>3.2 Subscription tiers and payment options</h3>
      <p>
        All subscriptions are available as <strong>annual (paid upfront)</strong>{" "}
        or <strong>monthly instalments</strong>. The monthly instalment option
        carries a modest premium to reflect the flexibility of not committing to
        an annual payment.
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Annual (paid upfront)</th>
            <th>Monthly instalments</th>
            <th>Effective annual (monthly)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Onboarding fee (one-off, all tiers)</td>
            <td>$3,500</td>
            <td>$3,500</td>
            <td>N/A</td>
          </tr>
          <tr>
            <td>Base subscription (2 active projects)</td>
            <td>$35,000/year</td>
            <td>$3,100/month</td>
            <td>$37,200/year</td>
          </tr>
          <tr>
            <td>Additional projects (Base, flat fee per project)</td>
            <td>$1,850</td>
            <td>$1,850</td>
            <td>N/A</td>
          </tr>
          <tr>
            <td>Estimating (Base)</td>
            <td>Quoted separately</td>
            <td>Quoted separately</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Unlimited subscription (up to 5 projects)</td>
            <td>$85,000/year</td>
            <td>$7,500/month</td>
            <td>$90,000/year</td>
          </tr>
          <tr>
            <td>Additional projects (Unlimited)</td>
            <td>Included</td>
            <td>Included</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Estimating (Unlimited)</td>
            <td>Included (Annual only)</td>
            <td>Quoted separately</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <h3>3.3 Additional project fee</h3>
      <p>
        The additional project fee of $1,850 is a flat fee charged per project
        when a new active project is created beyond the included allowance. It
        applies equally to annual and monthly subscribers and is not subject to
        discount. A project is considered active from the date it is created
        until BuildHawk marks it as Completed.
      </p>
      <h3>3.4 Value reference</h3>
      <p>
        A full-time senior estimator and contract administrator in Australia
        costs between $280,000 and $342,000 per year in combined salary,
        superannuation at 12.5%, WorkCover at 4%, leave entitlements and
        recruitment fees. Hawktress delivers estimating intelligence,
        pre-construction benchmarking, variation control, live project cost
        tracking and monthly commercial reporting across multiple active
        projects at a materially lower total cost.
      </p>

      <h2>4. Contract administration and variation control</h2>
      <p>
        Where a Builder engages BuildHawk&apos;s contract administration service, the
        following rules apply within Hawktress:
      </p>
      <ul>
        <li>
          Every variation claim is assessed against the regional 5% variance
          threshold before the CA approves it
        </li>
        <li>
          Any variation that exceeds the threshold is flagged and referred to
          the BuildHawk Director for approval before the CA can proceed
        </li>
        <li>
          All variations, POs and committed costs are tracked in Hawktress in
          real time
        </li>
        <li>
          The Builder receives a monthly report covering all active jobs and a
          company financial snapshot, due by the 5th of each month
        </li>
      </ul>

      <h2>5. Monthly director report</h2>
      <p>The monthly report covers:</p>
      <ul>
        <li>
          Each active job: original contract value, current contract value,
          committed costs, forecast final cost, gross margin, variations
          approved that month and programme status
        </li>
        <li>
          Company financial snapshot: total contracted revenue, total revenue
          received, total committed costs, portfolio gross margin, outstanding
          invoices, aged debtors and 30, 60 and 90-day revenue forecast
        </li>
        <li>Escalation items requiring Builder decision or approval</li>
      </ul>

      <h2>6. Output and branding</h2>
      <p>
        All Hawktress outputs use the Builder&apos;s brand kit.{" "}
        <strong>&quot;Powered by Hawktress&quot;</strong> and the BuildHawk logo appear as
        a fixed, non-removable element on all outputs. This requirement is
        mandatory and is not subject to variation regardless of the Builder&apos;s
        brand preferences.
      </p>

      <h2>7. Data obligations</h2>
      <ul>
        <li>
          Project cost data may be used by BuildHawk in anonymised, aggregated
          regional benchmarks
        </li>
        <li>
          The Builder&apos;s identity and project-specific data will never be
          disclosed to any other subscriber
        </li>
        <li>
          The source of any pricing data in Hawktress outputs is never
          attributed to any individual project or Builder
        </li>
      </ul>

      <h2>8. Payment terms</h2>
      <ul>
        <li>Onboarding fee payable in full before onboarding commences</li>
        <li>
          Annual subscriptions invoiced in full at the start of the subscription
          period
        </li>
        <li>
          Monthly instalments invoiced in advance at the start of each calendar
          month
        </li>
        <li>
          Additional project fees invoiced when a new project is created beyond
          the included allowance
        </li>
        <li>Payment terms: 14 days from invoice date</li>
        <li>Late payment may result in suspension of platform access</li>
        <li>All fees are ex GST. GST of 10% is payable in addition</li>
      </ul>

      <h2>9. Term and termination</h2>
      <p>
        Annual subscriptions run for 12 months and renew automatically unless
        either party provides 30 days written notice of non-renewal. Monthly
        subscriptions continue month-to-month until terminated with 30 days
        written notice. No refunds for unused portions of any subscription
        period.
      </p>

      <h2>10. Intellectual property</h2>
      <p>
        The Hawktress platform, including its data model, intelligence layer,
        benchmarking methodology and all outputs, is the intellectual property
        of BuildHawk Pty Ltd. The Builder is granted a non-exclusive,
        non-transferable licence to use Hawktress outputs for their own internal
        business purposes during the subscription period. The Builder may not
        reproduce, resell, or commercially distribute Hawktress outputs without
        prior written consent from BuildHawk.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        Hawktress outputs are provided as intelligence and reference material
        only. They do not constitute professional quantity surveying, legal, or
        financial advice. To the maximum extent permitted by the Australian
        Consumer Law, BuildHawk&apos;s liability is limited to subscription fees paid
        in the 12 months preceding the claim.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Victoria,
        Australia.
      </p>
    </LegalLayout>
  );
}
