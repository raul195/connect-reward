import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export interface AuthContext {
  user: { id: string; email?: string };
  profile: Profile;
  admin: ReturnType<typeof createAdminClient>;
}

export async function getAuthContext(): Promise<
  | { ctx: AuthContext; error?: never }
  | { ctx?: never; error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: NextResponse.json({ error: "Profile not found" }, { status: 404 }) };
  }

  // Touch last_active on the company for business users (fire-and-forget)
  if (profile.company_id && profile.role !== "customer") {
    admin
      .from("companies")
      .update({ last_active: new Date().toISOString() })
      .eq("id", profile.company_id)
      .then(() => {});
  }

  return { ctx: { user, profile: profile as Profile, admin } };
}

export function requireAdmin(profile: Profile): NextResponse | null {
  if (!["business", "business_owner", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!profile.company_id) {
    return NextResponse.json({ error: "No company associated" }, { status: 403 });
  }
  return null;
}

export function requireSuperAdmin(profile: Profile): NextResponse | null {
  if (profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function requireCustomer(profile: Profile): NextResponse | null {
  if (profile.role !== "customer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
