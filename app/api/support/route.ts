import { NextResponse } from "next/server";
import { getAuthContext, requireCustomer } from "@/lib/api-helpers";

export async function GET() {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireCustomer(profile);
    if (forbidden) return forbidden;

    const { data: tickets, error } = await admin
      .from("support_tickets")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets: tickets ?? [] });
  } catch (error) {
    console.error("Support GET error:", error);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireCustomer(profile);
    if (forbidden) return forbidden;

    const body = await request.json();
    const { category, subject, description } = body;

    if (!category || !subject || !description) {
      return NextResponse.json(
        { error: "Category, subject, and description are required" },
        { status: 400 }
      );
    }

    const validCategories = ["bug", "account", "billing", "feature_request", "other"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const { data: ticket, error } = await admin
      .from("support_tickets")
      .insert({
        company_id: profile.company_id,
        profile_id: profile.id,
        category,
        subject,
        description,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Support POST error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
