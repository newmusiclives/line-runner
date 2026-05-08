import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

const ADMIN_ROUTES = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected && !isAdmin) return NextResponse.next();

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
