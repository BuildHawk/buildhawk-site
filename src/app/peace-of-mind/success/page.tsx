import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { verifyPaidSession } from "@/lib/peace-of-mind/stripe";
import SuccessUploadForm from "./SuccessUploadForm";

export const metadata: Metadata = {
  title: "Payment received - upload your quotes - BuildHawk Peace of Mind",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = { session_id?: string };

export default async function PeaceOfMindSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sessionId = (params?.session_id ?? "").trim();
  const verified = sessionId ? await verifyPaidSession(sessionId) : null;
  const paid = verified?.paymentStatus === "paid";

  return (
    <main className="relative bg-bh-white text-bh-black min-h-screen">
      <Nav />
      <section className="pt-32 md:pt-44 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-8 md:gap-12">
            <div className="col-span-12 md:col-span-4">
              <p className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.2em] uppercase text-bh-orange">
                <span className="inline-block w-3 h-px bg-bh-orange" />
                Peace of Mind
              </p>
              {paid ? (
                <h1 className="mt-4 font-medium tracking-[-0.03em] leading-[1.0] text-[36px] md:text-[52px] text-bh-black">
                  Payment received.
                  <br />
                  <span className="text-bh-orange">Now send us your quotes.</span>
                </h1>
              ) : (
                <h1 className="mt-4 font-medium tracking-[-0.03em] leading-[1.0] text-[36px] md:text-[52px] text-bh-black">
                  We can&rsquo;t verify your payment yet.
                </h1>
              )}
              {paid && (
                <p className="mt-5 text-[15px] leading-[1.55] text-bh-graphite max-w-md">
                  A tax invoice for ${(((verified?.amountTotal ?? 0) / 100) || 499).toFixed(2)}{" "}
                  {verified?.currency?.toUpperCase() || "AUD"} is on its way to{" "}
                  <strong>{verified?.customerEmail || verified?.form.email}</strong>.
                  Upload your builder quotes below and we&rsquo;ll have a detailed
                  report back within 5 business days.
                </p>
              )}
              {!paid && (
                <p className="mt-5 text-[15px] leading-[1.55] text-bh-graphite max-w-md">
                  If you just completed payment, give Stripe a moment and reload.
                  Otherwise{" "}
                  <Link href="/peace-of-mind#start" className="text-bh-orange underline">
                    return to the order page
                  </Link>{" "}
                  or email{" "}
                  <a href="mailto:info@buildhawk.com.au" className="text-bh-orange underline">
                    info@buildhawk.com.au
                  </a>
                  .
                </p>
              )}
            </div>
            <div className="col-span-12 md:col-span-8">
              {paid && verified ? (
                <SuccessUploadForm
                  sessionId={verified.sessionId}
                  prefilledName={verified.form.name}
                  prefilledQuoteCount={verified.form.quoteCount}
                />
              ) : (
                <div className="rounded-[10px] border border-bh-steel/60 bg-bh-cloud p-8 md:p-10">
                  <p className="text-[14px] text-bh-graphite leading-[1.55]">
                    No verified payment was found for this link. If you believe
                    this is a mistake, please reply to your Stripe receipt or
                    email us with the session reference.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
