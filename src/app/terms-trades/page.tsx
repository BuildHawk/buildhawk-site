import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Trade Subscriber Terms · Hawktress · BuildHawk",
  description:
    "Terms of use for Hawktress Trade subscriptions. Issued by BuildHawk Pty Ltd.",
};

export default function TradeTermsPage() {
  return (
    <LegalLayout
      eyebrow="Hawktress · Client-facing"
      title="Trade Subscriber Terms of Use"
      version="v3.0"
      date="1 May 2026"
    >
      <h2>1. Agreement</h2>
      <p>
        These terms govern access to and use of the Hawktress platform by trade
        contractors and trade businesses (Trade) who subscribe through
        BuildHawk Pty Ltd (BuildHawk). By paying a subscription fee, the Trade
        agrees to be bound by these terms.
      </p>

      <h2>2. Subscription pricing</h2>
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
            <td>Trade subscription (single trade category, all AU and NZ regions)</td>
            <td>$4,800/year</td>
            <td>$430/month</td>
            <td>$5,160/year</td>
          </tr>
          <tr>
            <td>Builder exposure</td>
            <td>Not included</td>
            <td>Not included</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Supplier platform listing</td>
            <td>Available as add-on</td>
            <td>Available as add-on</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <p>
        All fees are quoted in AUD exclusive of GST. GST of 10% is payable in
        addition. Annual subscriptions are invoiced in full upfront. Monthly
        instalments are invoiced in advance each calendar month and carry a
        modest premium over the annual rate.
      </p>

      <h2>3. What the subscription includes</h2>
      <p>
        A Trade subscription provides access to Hawktress cost intelligence for
        the nominated trade category across all Australian states, territories,
        and New Zealand regions, spanning all lifecycle stages from estimating
        through to project completion. Specifically:
      </p>
      <ul>
        <li>
          <strong>Regional cost benchmarks:</strong> rates by region, build
          type and rate type (per m², per lm, lump sum, per item, per unit)
        </li>
        <li>
          <strong>Market trend data:</strong> how trade pricing is moving over
          time across regions
        </li>
        <li>
          <strong>Variance analysis:</strong> where the Trade&apos;s own pricing sits
          relative to the regional rolling average
        </li>
        <li>
          <strong>Lifecycle benchmarks:</strong> quote-stage rates versus
          variation-stage rates versus final delivered costs, by trade category
          and region
        </li>
        <li>
          <strong>Supplier performance data</strong> within their trade
          category, presented on an anonymised basis
        </li>
      </ul>

      <h2>4. What is not included</h2>
      <ul>
        <li>Access to cost data outside the subscribed trade category</li>
        <li>
          Builder profile information, builder contact details, or
          project-specific data attributable to an identifiable builder
        </li>
        <li>
          Direct builder introductions or leads (requires a separate supplier
          platform listing)
        </li>
        <li>Estimating services (quoted separately by BuildHawk on request)</li>
      </ul>

      <h2>5. Trade categories</h2>
      <p>
        Each subscription covers a single trade category. A Trade operating
        across multiple categories must purchase a separate subscription for
        each. BuildHawk may update the category list with 30 days written
        notice.
      </p>

      <h2>6. Data and confidentiality</h2>
      <ul>
        <li>
          Cost data captured through Hawktress is used in anonymised, aggregated
          regional benchmarks
        </li>
        <li>
          The Trade&apos;s identity is never disclosed in any benchmark output
          visible to other subscribers
        </li>
        <li>The source of any pricing data is never disclosed</li>
      </ul>

      <h2>7. Output standards</h2>
      <p>
        All Hawktress outputs carry the <strong>&quot;Powered by Hawktress&quot;</strong>{" "}
        identifier and the BuildHawk logo as a fixed, non-removable element on
        all outputs.
      </p>

      <h2>8. Payment terms</h2>
      <ul>
        <li>Monthly fees invoiced in advance at the start of each calendar month</li>
        <li>Annual fees invoiced in full at the start of the subscription period</li>
        <li>Payment terms: 14 days from invoice date</li>
        <li>No refunds for unused portions of a subscription period</li>
        <li>All fees are ex GST. GST of 10% is payable in addition</li>
      </ul>

      <h2>9. Term and renewal</h2>
      <p>
        Monthly subscriptions continue month-to-month until terminated by either
        party with 14 days written notice. Annual subscriptions run for 12
        months and renew automatically unless either party provides 30 days
        written notice of non-renewal.
      </p>

      <h2>10. Intellectual property</h2>
      <p>
        Hawktress outputs are provided for the Trade&apos;s own internal business use
        only during the subscription period. The Trade may not reproduce,
        resell, or commercially distribute Hawktress data or outputs without
        prior written consent from BuildHawk.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        Hawktress outputs are provided as market intelligence and reference
        material only. To the maximum extent permitted by the Australian
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
