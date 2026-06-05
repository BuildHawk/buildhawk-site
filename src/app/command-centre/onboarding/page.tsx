import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveContext } from "@/lib/auth";
import { getGhlConfig } from "@/lib/integrations";
import GlassBackground from "../_components/GlassBackground";
import OnboardingWizard from "./OnboardingWizard";

export const metadata: Metadata = {
  title: "Welcome to BuildHawk · Engagement setup",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const ctx = await getActiveContext();
  if (!ctx) redirect("/command-centre/login?next=/command-centre/onboarding");

  // If already onboarded (has active GHL integration), skip the wizard.
  const ghl = await getGhlConfig(ctx.tenant.id).catch(() => null);
  if (ghl) redirect("/command-centre");

  return (
    <div className="min-h-screen text-slate-900 relative">
      <GlassBackground tone="light" />
      <OnboardingWizard
        tenant={{
          id: ctx.tenant.id,
          name: ctx.tenant.name,
          status: ctx.tenant.status,
        }}
        user={{
          email: ctx.user.email,
          name: ctx.user.name ?? null,
        }}
      />
    </div>
  );
}
