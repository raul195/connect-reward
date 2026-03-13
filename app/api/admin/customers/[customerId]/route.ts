import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { manualPointAdjustment } from "@/lib/points";

// GET — Fetch full customer profile with related data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile: adminProfile, admin } = result.ctx;

    const forbidden = requireAdmin(adminProfile);
    if (forbidden) return forbidden;

    const cid = adminProfile.company_id!;
    const { customerId } = await params;

    // Fetch all data in parallel
    const [profileRes, referralsRes, pointsRes, emailsRes, prefsRes] =
      await Promise.all([
        admin
          .from("profiles")
          .select("*")
          .eq("id", customerId)
          .eq("company_id", cid)
          .eq("role", "customer")
          .single(),
        admin
          .from("referrals")
          .select("*")
          .eq("company_id", cid)
          .eq("submitted_by", customerId)
          .order("created_at", { ascending: false })
          .limit(50),
        admin
          .from("point_transactions")
          .select("*")
          .eq("company_id", cid)
          .eq("user_id", customerId)
          .order("created_at", { ascending: false })
          .limit(50),
        admin
          .from("email_logs")
          .select("*")
          .eq("company_id", cid)
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(50),
        admin
          .from("email_preferences")
          .select("*")
          .eq("customer_id", customerId)
          .maybeSingle(),
      ]);

    if (!profileRes.data) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        profile: profileRes.data,
        referrals: referralsRes.data ?? [],
        pointTransactions: pointsRes.data ?? [],
        emailLogs: emailsRes.data ?? [],
        emailPreferences: prefsRes.data ?? null,
      },
    });
  } catch (error) {
    console.error("Customer profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to load customer profile" },
      { status: 500 }
    );
  }
}

// POST — Customer actions (adjust points, toggle DNC)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile: adminProfile, admin } = result.ctx;

    const forbidden = requireAdmin(adminProfile);
    if (forbidden) return forbidden;

    const cid = adminProfile.company_id!;
    const { customerId } = await params;
    const body = await request.json();

    // Verify customer belongs to this company
    const { data: customer } = await admin
      .from("profiles")
      .select("id, company_id")
      .eq("id", customerId)
      .eq("company_id", cid)
      .eq("role", "customer")
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const { action } = body as { action: string };

    if (action === "adjust_points") {
      const { amount, reason } = body as {
        amount: number;
        reason: string;
      };
      if (typeof amount !== "number") {
        return NextResponse.json(
          { error: "amount is required" },
          { status: 400 }
        );
      }
      await manualPointAdjustment(customerId, cid, amount, reason, admin);
      return NextResponse.json({ success: true });
    }

    if (action === "toggle_dnc") {
      // Toggle opt_out in email_preferences
      const { data: prefs } = await admin
        .from("email_preferences")
        .select("opt_out")
        .eq("customer_id", customerId)
        .maybeSingle();

      if (prefs) {
        await admin
          .from("email_preferences")
          .update({ opt_out: !prefs.opt_out })
          .eq("customer_id", customerId);
      } else {
        // Create preferences with opt_out = true
        await admin.from("email_preferences").insert({
          customer_id: customerId,
          opt_out: true,
        });
      }

      return NextResponse.json({
        success: true,
        opt_out: prefs ? !prefs.opt_out : true,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Customer profile POST error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
