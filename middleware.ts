import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Public routes — always accessible
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/early-access") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/early-access")
  ) {
    return supabaseResponse;
  }

  // DEV ONLY: skip auth so you can inspect all pages without logging in.
  // Remove or set to false before deploying to production.
  const DEV_BYPASS_AUTH = process.env.NODE_ENV === "development";
  if (DEV_BYPASS_AUTH) {
    return supabaseResponse;
  }

  // Not authenticated — redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
