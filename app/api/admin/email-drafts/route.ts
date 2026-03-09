import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { textToHtml } from "@/lib/email/injectVariables";

export async function GET(req: NextRequest) {
  const { ctx, error } = await getAuthContext();
  if (error) return error;
  const forbidden = requireAdmin(ctx.profile);
  if (forbidden) return forbidden;

  const companyId = ctx.profile.company_id!;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // draft, approved, sent, cancelled
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  let query = ctx.admin
    .from("email_draft_queue")
    .select(
      "*, profiles!email_draft_queue_customer_id_fkey(full_name, email)",
      { count: "exact" }
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error: fetchError, count } = await query;

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }

  return NextResponse.json({ drafts: data, total: count, page, limit });
}

export async function PUT(req: NextRequest) {
  const { ctx, error } = await getAuthContext();
  if (error) return error;
  const forbidden = requireAdmin(ctx.profile);
  if (forbidden) return forbidden;

  const companyId = ctx.profile.company_id!;
  const body = await req.json();

  // Bulk approve
  if (body.action === "bulk_approve" && Array.isArray(body.ids)) {
    const { error: updateError } = await ctx.admin
      .from("email_draft_queue")
      .update({ status: "approved" })
      .eq("company_id", companyId)
      .eq("status", "draft")
      .in("id", body.ids);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to bulk approve" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }

  // Single approve/cancel with optional edits
  const { id, status: newStatus, subject, body_text, scheduled_send_at } = body;

  // Save body_text edit (no status change required)
  if (id && body_text !== undefined && !newStatus) {
    // Fetch existing draft
    const { data: existing, error: fetchErr } = await ctx.admin
      .from("email_draft_queue")
      .select("email_data")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    const emailData = (existing.email_data || {}) as Record<string, unknown>;
    emailData.body_text = body_text;
    emailData.body_html = textToHtml(body_text);
    emailData.edited_by_admin = true;

    const updateData: Record<string, unknown> = { email_data: emailData };
    if (subject) updateData.subject = subject;

    const { error: updateError } = await ctx.admin
      .from("email_draft_queue")
      .update(updateData)
      .eq("id", id)
      .eq("company_id", companyId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save edits" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }

  if (!id || !newStatus) {
    return NextResponse.json(
      { error: "Missing id or status" },
      { status: 400 }
    );
  }

  if (!["approved", "cancelled"].includes(newStatus)) {
    return NextResponse.json(
      { error: "Status must be approved or cancelled" },
      { status: 400 }
    );
  }

  // If body_text is provided along with status change, save edits first
  const updateData: Record<string, unknown> = { status: newStatus };
  if (subject) updateData.subject = subject;
  if (scheduled_send_at) updateData.scheduled_send_at = scheduled_send_at;

  if (body_text !== undefined) {
    const { data: existing } = await ctx.admin
      .from("email_draft_queue")
      .select("email_data")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    if (existing) {
      const emailData = (existing.email_data || {}) as Record<string, unknown>;
      emailData.body_text = body_text;
      emailData.body_html = textToHtml(body_text);
      emailData.edited_by_admin = true;
      updateData.email_data = emailData;
    }
  }

  const { error: updateError } = await ctx.admin
    .from("email_draft_queue")
    .update(updateData)
    .eq("id", id)
    .eq("company_id", companyId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update draft" },
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
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error: updateError } = await ctx.admin
    .from("email_draft_queue")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("company_id", companyId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to cancel draft" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
