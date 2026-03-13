import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

// POST — Save all onboarding data and mark complete
export async function POST(req: Request) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireAdmin(profile);
  if (forbidden) return forbidden;

  const cid = profile.company_id!;

  try {
    const body = await req.json();
    const {
      industries,
      services,
      reviewRewards,
    } = body as {
      industries: string[];
      services: {
        name: string;
        industry: string;
        job_value: number;
        referral_percentage: number;
        points_value: number;
      }[];
      reviewRewards: Record<string, number>;
    };

    // 1. Fetch current settings to merge
    const { data: current } = await admin
      .from("businesses")
      .select("settings")
      .eq("id", cid)
      .single();

    const mergedSettings = {
      ...(current?.settings ?? {}),
      review_platform_points: reviewRewards,
    };

    // 2. Update company industry + settings + mark onboarding complete
    const { error: companyError } = await admin
      .from("businesses")
      .update({
        industry: industries.join(", "),
        settings: mergedSettings,
        onboarding_completed: true,
      })
      .eq("id", cid);

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }

    // 3. Insert services
    if (services.length > 0) {
      const serviceRows = services.map((s, i) => ({
        company_id: cid,
        name: s.name,
        industry: s.industry,
        job_value: s.job_value,
        referral_percentage: s.referral_percentage,
        points_value: s.points_value,
        is_active: true,
        display_order: i,
      }));

      const { error: svcError } = await admin
        .from("services")
        .insert(serviceRows);

      if (svcError) {
        return NextResponse.json({ error: svcError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// GET — Check onboarding status
export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireAdmin(profile);
  if (forbidden) return forbidden;

  const cid = profile.company_id!;

  const { data: company } = await admin
    .from("businesses")
    .select("onboarding_completed, industry, settings, plan_tier, name")
    .eq("id", cid)
    .single();

  return NextResponse.json({ data: company });
}
