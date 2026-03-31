import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages that require authentication (at minimum a Free account)
const PROTECTED_ROUTES = [
  "/upload",
  "/dashboard",
  "/rehearse",
  "/vault",
  "/self-tape",
  "/vo-tools",
  "/marketplace",
  "/pass",
  "/scene-exchange",
  "/voice-print",
  "/studio",
];

// Admin-only routes
const ADMIN_ROUTES = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires auth
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected && !isAdmin) return NextResponse.next();

  // Check for session token (NextAuth uses this cookie)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/upload/:path*",
    "/dashboard/:path*",
    "/rehearse/:path*",
    "/vault/:path*",
    "/self-tape/:path*",
    "/vo-tools/:path*",
    "/marketplace/:path*",
    "/pass/:path*",
    "/scene-exchange/:path*",
    "/voice-print/:path*",
    "/studio/:path*",
    "/admin/:path*",
  ],
};
