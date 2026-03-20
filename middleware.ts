import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const AUTH_ROUTES = ["/admin", "/dashboard", "/super-admin"];

// Routes that must NEVER be redirected (prevents loops)
const NEVER_REDIRECT = ["/login", "/signup", "/admin/onboarding"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never redirect login, signup, or onboarding (prevents loops)
  if (NEVER_REDIRECT.some((route) => pathname.startsWith(route))) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Refresh session cookies
  const { user, supabaseResponse } = await updateSession(request);

  // Check if this is a protected route
  const isProtected = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    return supabaseResponse;
  }

  // Protected route — redirect to login if not authenticated
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
     * Run middleware ONLY on app routes.
     * Exclude everything that is NOT a page route:
     * - _next (all Next.js internals: static, image, chunks, etc.)
     * - api (API routes handle their own auth)
     * - Files with extensions (static assets)
     */
    "/((?!_next|api|.*\\..*).*)",
  ],
};
