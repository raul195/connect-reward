import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { hasOverlappingPromotion } from "@/lib/promotions";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;

    const { data: promotions } = await admin
      .from("promotions")
      .select("*")
      .eq("company_id", cid)
      .order("start_date", { ascending: false });

    return NextResponse.json({ promotions: promotions ?? [] });
  } catch (error) {
    console.error("Promotions GET error:", error);
    return NextResponse.json(
      { error: "Failed to load promotions" },
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
    const body = await request.json();

    // Validate multiplier
    const multiplier = parseFloat(body.multiplier);
    if (isNaN(multiplier) || multiplier < 1.0 || multiplier > 10.0) {
      return NextResponse.json(
        { error: "Multiplier must be between 1.0 and 10.0" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);
    const now = new Date();

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Start date must be today or in the future (allow same day)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (startDate < todayStart) {
      return NextResponse.json(
        { error: "Start date cannot be in the past" },
        { status: 400 }
      );
    }

    // Max 90 days duration
    const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays > 90) {
      return NextResponse.json(
        { error: "Promotion duration cannot exceed 90 days" },
        { status: 400 }
      );
    }

    // Check overlap
    const overlap = await hasOverlappingPromotion(
      cid,
      body.start_date,
      body.end_date,
      admin
    );
    if (overlap) {
      return NextResponse.json(
        { error: "This promotion overlaps with an existing active promotion" },
        { status: 409 }
      );
    }

    const { data: promotion, error } = await admin
      .from("promotions")
      .insert({
        company_id: cid,
        name: body.name,
        description: body.description || null,
        multiplier,
        start_date: body.start_date,
        end_date: body.end_date,
        notify_customers: body.notify_customers ?? true,
        send_reminder: body.send_reminder ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get estimated reach
    const { count: estimatedReach } = await admin
      .from("email_preferences")
      .select("id", { count: "exact", head: true })
      .eq("promotional_emails_enabled", true)
      .in(
        "customer_id",
        (
          await admin
            .from("profiles")
            .select("id")
            .eq("company_id", cid)
            .eq("role", "customer")
        ).data?.map((p) => p.id) ?? []
      );

    return NextResponse.json({ promotion, estimatedReach: estimatedReach ?? 0 });
  } catch (error) {
    console.error("Promotions POST error:", error);
    return NextResponse.json(
      { error: "Failed to create promotion" },
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

    // If updating dates or multiplier, re-validate
    if (updates.start_date && updates.end_date) {
      const overlap = await hasOverlappingPromotion(
        cid,
        updates.start_date,
        updates.end_date,
        admin,
        id
      );
      if (overlap) {
        return NextResponse.json(
          { error: "This promotion overlaps with an existing active promotion" },
          { status: 409 }
        );
      }
    }

    if (updates.multiplier !== undefined) {
      const mult = parseFloat(updates.multiplier);
      if (isNaN(mult) || mult < 1.0 || mult > 10.0) {
        return NextResponse.json(
          { error: "Multiplier must be between 1.0 and 10.0" },
          { status: 400 }
        );
      }
    }

    const { data: promotion, error } = await admin
      .from("promotions")
      .update(updates)
      .eq("id", id)
      .eq("company_id", cid)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error("Promotions PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update promotion" },
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

    // Soft delete — set is_active=false
    const { error } = await admin
      .from("promotions")
      .update({ is_active: false })
      .eq("id", id)
      .eq("company_id", cid);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Promotions DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to cancel promotion" },
      { status: 500 }
    );
  }
}
