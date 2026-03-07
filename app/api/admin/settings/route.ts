import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;

    const [companyRes, servicesRes] = await Promise.all([
      admin.from("companies").select("*").eq("id", cid).single(),
      admin
        .from("services")
        .select("*")
        .eq("company_id", cid)
        .order("display_order", { ascending: true }),
    ]);

    return NextResponse.json({
      company: companyRes.data,
      services: servicesRes.data ?? [],
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
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

    const { data: company, error } = await admin
      .from("companies")
      .update(body)
      .eq("id", cid)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
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

    if (body.id) {
      // Update existing service
      const { id, ...updates } = body;
      const { data: service, error } = await admin
        .from("services")
        .update(updates)
        .eq("id", id)
        .eq("company_id", cid)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ service });
    } else {
      // Insert new service
      const { data: service, error } = await admin
        .from("services")
        .insert({ ...body, company_id: cid })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ service });
    }
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json(
      { error: "Failed to save service" },
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
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        { error: "serviceId is required" },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("company_id", cid);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
