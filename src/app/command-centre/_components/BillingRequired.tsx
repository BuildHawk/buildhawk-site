import Link from "next/link";
import Image from "next/image";
import GlassBackground from "./GlassBackground";
import type { TenantAccess } from "@/lib/billing/access";

const headlines: Record<TenantAccess["state"], string> = {
  active: "Engagement is active",
  trialing: "Engagement in progress",
  trial_expired: "Engagement paused",
  past_due: "Engagement on hold",
  canceled: "Engagement closed",
  paused: "Engagement paused",
};

export default function BillingRequired({
  tenant,
  state,
  reason,
}: {
  tenant: { name: string };
  state: TenantAccess["state"];
  reason: string | null;
}) {
  return (
    <div className="min-h-screen text-slate-900 relative flex items-center justify-center px-4 sm:px-6">
      <GlassBackground tone="light" />
      <main className="relative w-full max-w-xl text-center">
        <Link
          href="/command-centre"
          className="flex items-center gap-2.5 justify-center mb-8"
          aria-label="BuildHawk home"
        >
          <Image
            src="/brand/emblem-bh.svg"
            alt="BuildHawk"
            width={42}
            height={32}
            priority
            className="block"
          />
          <div className="leading-tight">
            <div
              className="text-bh-black font-semibold uppercase"
              style={{ fontSize: 15, letterSpacing: "0.04em" }}
            >
              BUILDHAWK
            </div>
            <div
              className="text-bh-graphite mt-0.5 uppercase font-semibold"
              style={{ fontSize: 10, letterSpacing: "0.18em" }}
            >
              Cost Plan Console
            </div>
          </div>
        </Link>

        <div
          className="relative rounded-3xl border border-white/40 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] overflow-hidden text-left"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
            backdropFilter: "blur(28px) saturate(140%)",
            WebkitBackdropFilter: "blur(28px) saturate(140%)",
          }}
        >
          <div className="p-7">
            <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
              {tenant.name}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
              {headlines[state]}
            </h1>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed">
              {reason}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="mailto:services@buildhawk.com.au?subject=Cost%20Plan%20Console%20engagement"
                className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-bh-ink text-white text-sm font-semibold hover:bg-bh-ink/90"
              >
                Contact us about your engagement
              </Link>
            </div>
            <p className="mt-6 text-[11px] text-slate-500">
              Your project data is preserved and reappears once the engagement resumes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
