import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Only these route prefixes need middleware (auth check + session refresh)
const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/super-admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run on protected routes — everything else passes through instantly
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Allow onboarding page without redirect (prevents loop)
  const isOnboarding = pathname.startsWith("/admin/onboarding");

  // Refresh session and check auth
  const { user, supabaseResponse } = await updateSession(request);

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
    // Only match app routes, exclude static assets and API
    "/((?!_next|api|.*\\..*).*)",
  ],
};
