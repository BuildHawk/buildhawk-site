import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getActiveContext } from "@/lib/auth";
import { getGhlConfig } from "@/lib/integrations";
import GlassBackground from "../_components/GlassBackground";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings · BuildHawk Cost Plan Console",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await getActiveContext();
  if (!ctx) redirect("/command-centre/login?next=/command-centre/settings");
  const ghl = await getGhlConfig(ctx.tenant.id).catch(() => null);
  return (
    <div className="min-h-screen text-slate-900">
      <GlassBackground tone="light" />
      <header className="relative border-b border-white/40 bg-white/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/command-centre" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Cost Plan Console
          </Link>
          <div className="flex-1" />
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {ctx.tenant.name}
          </div>
        </div>
      </header>
      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
            Engagement settings
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">{ctx.tenant.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Status: <strong>{ctx.tenant.status}</strong>
          </p>
        </div>

        <SettingsClient
          tenant={{
            id: ctx.tenant.id,
            name: ctx.tenant.name,
            status: ctx.tenant.status,
          }}
          membership={{ role: ctx.membership.role }}
          ghl={
            ghl
              ? {
                  locationId: ghl.locationId,
                  hasApiKey: Boolean(ghl.apiKey),
                  projectDataFieldId: ghl.projectDataFieldId ?? null,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
