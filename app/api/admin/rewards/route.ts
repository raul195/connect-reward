import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { isAtLimit } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/types";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;

    const { data: rewards } = await admin
      .from("rewards")
      .select("*")
      .eq("company_id", cid)
      .order("created_at", { ascending: false });

    return NextResponse.json({ rewards: rewards ?? [] });
  } catch (error) {
    console.error("Rewards GET error:", error);
    return NextResponse.json(
      { error: "Failed to load rewards" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;

    // Check plan limit
    const { data: companyData } = await admin
      .from("companies")
      .select("plan_tier")
      .eq("id", cid)
      .single();
    const plan = (companyData?.plan_tier ?? "free") as PlanTier;
    const { count: rewardCount } = await admin
      .from("rewards")
      .select("id", { count: "exact", head: true })
      .eq("company_id", cid);
    if (isAtLimit(plan, "rewards", rewardCount ?? 0)) {
      return NextResponse.json(
        { error: "You've reached your plan's reward limit. Upgrade to add more." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { data: reward, error } = await admin
      .from("rewards")
      .insert({ ...body, company_id: cid })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reward });
  } catch (error) {
    console.error("Rewards POST error:", error);
    return NextResponse.json(
      { error: "Failed to create reward" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data: reward, error } = await admin
      .from("rewards")
      .update(updates)
      .eq("id", id)
      .eq("company_id", cid)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reward });
  } catch (error) {
    console.error("Rewards PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update reward" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await admin
      .from("rewards")
      .delete()
      .eq("id", id)
      .eq("company_id", cid);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rewards DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete reward" },
      { status: 500 }
    );
  }
}
