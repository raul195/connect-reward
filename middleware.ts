import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const AUTH_ROUTES = ["/admin", "/dashboard", "/super-admin"];
// Routes that should never be redirected (public or auth pages)
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/faq", "/how-it-works", "/blog", "/privacy", "/terms", "/unsubscribe"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh session cookies on every request
  const { user, supabaseResponse } = await updateSession(request);

  // Check if this is a protected route
  const isProtected = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    // Public route — allow through
    return supabaseResponse;
  }

  // Protected route — check auth
  if (!user) {
    // Not logged in — redirect to login
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
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - Static assets (images, fonts, manifest, etc.)
     * - API routes (handled by their own auth)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$|.*\\.json$|.*\\.js$|.*\\.css$|.*\\.webp$|.*\\.woff2?$|api/).*)",
  ],
};
