import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { manualPointAdjustment } from "@/lib/points";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const tier = searchParams.get("tier") ?? "";
    const sortCol = searchParams.get("sort") ?? "total_points";
    const asc = searchParams.get("asc") === "true";
    const page = parseInt(searchParams.get("page") ?? "0", 10);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = admin
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("company_id", cid)
      .eq("role", "customer");

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (tier) {
      query = query.eq("tier", tier);
    }

    query = query
      .order(sortCol, { ascending: asc })
      .range(from, to);

    const { data: customers, count } = await query;

    return NextResponse.json({
      customers: customers ?? [],
      total: count ?? 0,
    });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { error: "Failed to load customers" },
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
    const { userId, amount, reason } = await request.json();

    if (!userId || typeof amount !== "number") {
      return NextResponse.json(
        { error: "userId and amount are required" },
        { status: 400 }
      );
    }

    await manualPointAdjustment(userId, cid, amount, reason, admin);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json(
      { error: "Failed to adjust points" },
      { status: 500 }
    );
  }
}
