import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://buildhawk.com.au";

/**
 * Crawl policy.
 *
 *  PUBLIC + indexable
 *    /                                  marketing home
 *    /faq, /partners, /insights*, /articles*, /data-policy, /terms-*
 *    /status                            uptime / status page
 *    /command-centre/login              sign-in + request-access (tabbed)
 *    /command-centre/request-access     access request landing
 *
 *  PUBLIC but NOINDEX (auth/payment surfaces — don't pollute search)
 *    nothing right now; everything public is indexable.
 *
 *  GATED (auth required — never crawl)
 *    /command-centre                    dashboard
 *    /command-centre/onboarding         post-signup wizard
 *    /command-centre/settings           plan, integrations, team, audit
 *    /command-centre/new-project        create opportunity
 *    /command-centre/projects/*         workbook editor
 *    /command-centre/architecture       internal diagrams
 *
 *  ALL APIs are crawler-disallowed regardless of gate.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/command-centre/login",
          "/command-centre/request-access",
        ],
        // /command-centre is a gated surface; allow exceptions above carve out
        // the public landings, everything else under it stays out of search.
        disallow: ["/api/", "/command-centre"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
