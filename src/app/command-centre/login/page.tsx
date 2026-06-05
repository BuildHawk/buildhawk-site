import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { isAuthConfigured, getSessionEmail } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in · BuildHawk Cost Plan Console",
  description:
    "Sign in to the BuildHawk Cost Plan Console. Access is by invitation only.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sign in · BuildHawk Cost Plan Console",
    description: "Access is by invitation only.",
  },
};

export const dynamic = "force-dynamic";

type Params = Promise<{ next?: string; error?: string; invitationOnly?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const email = await getSessionEmail();
  if (email) {
    const target = sp.next && sp.next.startsWith("/") ? sp.next : "/command-centre";
    redirect(target);
  }
  return (
    <LoginForm
      next={sp.next}
      error={sp.error}
      configured={isAuthConfigured()}
      invitationOnly={sp.invitationOnly === "1"}
    />
  );
}
