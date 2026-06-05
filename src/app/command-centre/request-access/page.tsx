import type { Metadata } from "next";
import RequestAccessForm from "./RequestAccessForm";

export const metadata: Metadata = {
  title: "Apply for an engagement · BuildHawk Cost Plan Console",
  description:
    "Apply for a BuildHawk engagement. We'll review your application and respond within one business day.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Apply for an engagement · BuildHawk Cost Plan Console",
    description:
      "Pre-contract cost intelligence for residential builders. Apply for an engagement.",
  },
};

export default function RequestAccessPage() {
  return <RequestAccessForm />;
}
