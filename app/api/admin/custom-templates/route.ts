import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { ctx, error } = await getAuthContext();
  if (error) return error;
  const forbidden = requireAdmin(ctx.profile);
  if (forbidden) return forbidden;

  const companyId = ctx.profile.company_id!;

  const { data, error: fetchError } = await ctx.admin
    .from("custom_templates")
    .select("*")
    .eq("company_id", companyId)
    .order("trigger_type")
    .order("tone")
    .order("variation_index");

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch custom templates" },
      { status: 500 }
    );
  }

  return NextResponse.json({ templates: data || [] });
}

export async function PUT(req: NextRequest) {
  const { ctx, error } = await getAuthContext();
  if (error) return error;
  const forbidden = requireAdmin(ctx.profile);
  if (forbidden) return forbidden;

  const companyId = ctx.profile.company_id!;
  const body = await req.json();
  const { trigger_type, tone, variation_index, subject, body: templateBody } = body;

  if (!trigger_type || !tone || variation_index === undefined || !subject || !templateBody) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { error: upsertError } = await ctx.admin
    .from("custom_templates")
    .upsert(
      {
        company_id: companyId,
        trigger_type,
        tone,
        variation_index,
        subject,
        body: templateBody,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,trigger_type,tone,variation_index" }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to save custom template" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { ctx, error } = await getAuthContext();
  if (error) return error;
  const forbidden = requireAdmin(ctx.profile);
  if (forbidden) return forbidden;

  const companyId = ctx.profile.company_id!;
  const body = await req.json();
  const { trigger_type, tone, variation_index } = body;

  if (!trigger_type || !tone || variation_index === undefined) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { error: deleteError } = await ctx.admin
    .from("custom_templates")
    .delete()
    .eq("company_id", companyId)
    .eq("trigger_type", trigger_type)
    .eq("tone", tone)
    .eq("variation_index", variation_index);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete custom template" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
