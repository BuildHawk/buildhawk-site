import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Supplier Platform Terms · Hawktress · BuildHawk",
  description:
    "Terms and conditions for Hawktress Supplier platform engagement. Issued by BuildHawk Pty Ltd.",
};

export default function SupplierTermsPage() {
  return (
    <LegalLayout
      eyebrow="Hawktress · Client-facing"
      title="Supplier Platform Terms and Conditions"
      version="v3.0"
      date="1 May 2026"
    >
      <h2>1. Agreement</h2>
      <p>
        These terms govern the engagement of any supplier, trade contractor, or
        materials supplier (Supplier) on the Hawktress platform, operated by
        BuildHawk Pty Ltd (BuildHawk). By paying a platform subscription fee,
        the Supplier agrees to be bound by these terms.
      </p>

      <h2>2. Platform subscription tiers</h2>
      <table>
        <thead>
          <tr>
            <th>Tier</th>
            <th>Coverage</th>
            <th>Annual fee (ex GST)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Regional</td>
            <td>Single AU state or territory, or single NZ region</td>
            <td>$4,500</td>
          </tr>
          <tr>
            <td>Multi-regional</td>
            <td>Up to 4 regions</td>
            <td>$8,500</td>
          </tr>
          <tr>
            <td>National AU</td>
            <td>All AU states and territories</td>
            <td>$14,000</td>
          </tr>
          <tr>
            <td>AU and NZ</td>
            <td>Full platform coverage</td>
            <td>$18,500</td>
          </tr>
        </tbody>
      </table>

      <h2>3. What the subscription includes</h2>
      <ul>
        <li>
          Full profile visibility to Hawktress builder and trade subscribers in
          nominated regions and trade category
        </li>
        <li>
          Recommendations to relevant builder subscribers based on regional
          coverage, trade category and performance data
        </li>
        <li>
          <strong>Hawktress Alliance participation rights.</strong> BuildHawk
          reserves the right to convene the Hawktress Alliance, a procurement
          collective of vetted Suppliers operating under shared commercial
          standards. Member Suppliers may be invited to participate in
          collective procurement negotiations on behalf of the Hawktress
          builder network. Members receive preferred platform placement and
          recommendation priority.
        </li>
        <li>
          Performance rating displayed on the Supplier profile, based on quote
          accuracy and delivery consistency against the Hawktress 5% variance
          threshold
        </li>
        <li>
          Visibility of where their pricing sits relative to regional benchmarks
          across all Hawktress lifecycle stages, from estimating through to
          project completion
        </li>
      </ul>

      <h2>4. Performance standards</h2>
      <p>
        Hawktress monitors supplier performance against a 5% variance threshold
        across all stages of the project lifecycle, including initial quotes,
        variation claims and final invoiced amounts versus PO values. A
        Supplier whose pricing consistently exceeds the threshold will be
        flagged internally and notified before any action is taken. BuildHawk
        reserves the right to add a performance note to the Supplier profile,
        remove recommendation status, or suspend the subscription with 30 days
        written notice.
      </p>

      <h2>5. Competitive requirement</h2>
      <p>
        Suppliers are admitted on the basis that their pricing is competitive
        within their nominated regions and trade category across all project
        stages. BuildHawk reserves the right to review platform eligibility at
        any time.
      </p>

      <h2>6. Data and confidentiality</h2>
      <ul>
        <li>
          Pricing data submitted to or captured through Hawktress is used in
          anonymised, aggregated regional benchmarks
        </li>
        <li>
          The Supplier&apos;s identity is never disclosed in any benchmark output
          visible to other subscribers
        </li>
        <li>
          The Supplier&apos;s profile information is visible to relevant builder and
          trade subscribers as part of the platform service
        </li>
      </ul>

      <h2>7. Payment terms</h2>
      <ul>
        <li>Subscription fees are invoiced annually in advance</li>
        <li>Payment due within 14 days of invoice date</li>
        <li>Late payment may result in suspension of platform access</li>
        <li>No refunds for unused portions of an annual subscription</li>
      </ul>

      <h2>8. Term and termination</h2>
      <p>
        The subscription runs for 12 months from first invoice and renews
        automatically unless either party provides 30 days written notice of
        non-renewal. BuildHawk may terminate immediately if the Supplier
        provides false pricing information, damages the platform&apos;s integrity,
        or fails to remedy a breach within 14 days of written notice.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by the Australian Consumer Law,
        BuildHawk&apos;s liability is limited to subscription fees paid in the 12
        months preceding the claim. BuildHawk is not liable for indirect,
        consequential, or economic loss.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Victoria,
        Australia.
      </p>
    </LegalLayout>
  );
}
