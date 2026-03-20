import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const AUTH_ROUTES = ["/admin", "/dashboard", "/super-admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh session cookies on every request
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
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$|.*\\.json$|.*\\.js$|.*\\.css$|.*\\.webp$|.*\\.woff2?$|api/).*)",
  ],
};
