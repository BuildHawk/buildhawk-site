import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyEdgeSession } from "@/lib/auth-edge";

/**
 * Public/gated boundary for the Cost Plan Console.
 *
 *  PAGE PATHS  matcher: /command-centre/:path*
 *    PUBLIC_PATHS below are exempted (pass through unauthenticated).
 *    Every other /command-centre/* path requires a valid session cookie.
 *
 *  API PATHS  matcher: /api/command-centre/((?!auth|stripe/webhook|admin|request-access).*)
 *    Negative-lookahead carves out four public API namespaces:
 *      - /auth/*           the auth flow itself validates internally
 *      - /stripe/webhook   Stripe signs the payload; we verify the signature
 *      - /admin/*          gated by SETUP_SECRET inside each handler
 *      - /request-access   self-serve top-of-funnel, no session yet
 *    Everything else under /api/command-centre/ requires a session.
 *
 *  /api/* OUTSIDE /api/command-centre/ (intake, waitlist, lead, chat, health)
 *  is never seen by this proxy and is publicly callable.
 */
export const config = {
  matcher: [
    "/command-centre/:path*",
    "/api/command-centre/((?!auth|stripe/webhook|admin|request-access).*)",
  ],
};

const PUBLIC_PATHS = new Set([
  "/command-centre/login",
  "/command-centre/signup",
  "/command-centre/request-access",
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // If the auth secret isn't set, allow bootstrap in development only. In
  // production a missing secret must FAIL CLOSED — never silently disable the
  // gate on every protected route.
  const secret = process.env.BH_AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Auth not configured" },
        { status: 503 },
      );
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/command-centre/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifyEdgeSession(token, secret);
  if (session) {
    const res = NextResponse.next();
    res.headers.set("x-bh-user-id", session.userId);
    res.headers.set("x-bh-tenant-id", session.tenantId);
    return res;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/command-centre/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}
