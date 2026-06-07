import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://buildhawk.com.au";

/**
 * Crawl policy.
 *
 *  PUBLIC + indexable
 *    /                                  marketing home
 *    /faq, /partners, /insights*, /articles*, /data-policy, /terms-*
 *    /status                            uptime / status page
 *
 *  HIDDEN (never crawl, not linked from the public site)
 *    /command-centre/*                  entire internal surface
 *    /api/*                             all API routes
 *
 *  /command-centre is reachable by direct URL for authorised users
 *  (proxy.ts enforces the auth gate) but is intentionally invisible
 *  to search engines and not linked from any public page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/", "/command-centre"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
