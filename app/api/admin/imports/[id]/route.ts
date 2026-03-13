import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { ensureEmailPreferences } from "@/lib/email/ensureEmailPreferences";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";
import { canSendEmail, logEmailSend } from "@/lib/email/throttle";

const BATCH_SIZE = 25;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireAdmin(profile);
  if (forbidden) return forbidden;

  const cid = profile.company_id!;
  const { id: importId } = await params;

  const { data: importRecord, error } = await admin
    .from("customer_imports")
    .select("*")
    .eq("id", importId)
    .eq("company_id", cid)
    .single();

  if (error || !importRecord) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  // Get recent errors for display
  const { data: recentErrors } = await admin
    .from("import_rows")
    .select("row_number, error_message, status")
    .eq("import_id", importId)
    .in("status", ["error", "skipped_invalid", "skipped_duplicate"])
    .order("row_number")
    .limit(20);

  return NextResponse.json({
    data: importRecord,
    recentErrors: recentErrors ?? [],
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireAdmin(profile);
  if (forbidden) return forbidden;

  const cid = profile.company_id!;
  const { id: importId } = await params;

  // Verify import belongs to company
  const { data: importRecord, error: importError } = await admin
    .from("customer_imports")
    .select("*")
    .eq("id", importId)
    .eq("company_id", cid)
    .single();

  if (importError || !importRecord) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  if (importRecord.status === "completed" || importRecord.status === "failed") {
    return NextResponse.json({
      data: importRecord,
      hasMore: false,
    });
  }

  // Set to processing if pending
  if (importRecord.status === "pending") {
    await admin
      .from("customer_imports")
      .update({ status: "processing" })
      .eq("id", importId);
  }

  // Fetch next batch of pending rows
  const { data: pendingRows, error: rowsError } = await admin
    .from("import_rows")
    .select("*")
    .eq("import_id", importId)
    .eq("status", "pending")
    .order("row_number")
    .limit(BATCH_SIZE);

  if (rowsError) {
    return NextResponse.json(
      { error: "Failed to fetch rows: " + rowsError.message },
      { status: 500 }
    );
  }

  if (!pendingRows || pendingRows.length === 0) {
    // No more rows — mark complete
    await admin
      .from("customer_imports")
      .update({ status: "completed" })
      .eq("id", importId);

    const { data: final } = await admin
      .from("customer_imports")
      .select("*")
      .eq("id", importId)
      .single();

    return NextResponse.json({ data: final, hasMore: false });
  }

  // Get company data for welcome emails
  const { data: companyData } = await admin
    .from("businesses")
    .select("name, logo_url, settings")
    .eq("id", cid)
    .single();

  const settings = (companyData?.settings ?? {}) as Record<string, unknown>;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";

  let batchCreated = 0;
  let batchSkipped = 0;
  let batchErrors = 0;

  for (const row of pendingRows) {
    try {
      const raw = row.raw_data as Record<string, string>;

      // Extract fields from raw_data (already mapped by client)
      const firstName = (raw.firstName || "").trim();
      const lastName = (raw.lastName || "").trim();
      const email = (raw.email || "").trim().toLowerCase();
      const phone = (raw.phone || "").replace(/\D/g, "");
      const address = (raw.address || "").trim() || null;
      const city = (raw.city || "").trim() || null;
      const state = (raw.state || "").trim() || null;
      const zip = (raw.zip || "").trim() || null;

      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

      // Validate
      if (!fullName || !email || !phone) {
        await admin
          .from("import_rows")
          .update({
            status: "skipped_invalid",
            error_message: [
              !fullName && "Name required",
              !email && "Email required",
              !phone && "Phone required",
            ]
              .filter(Boolean)
              .join("; "),
          })
          .eq("id", row.id);
        batchSkipped++;
        continue;
      }

      if (!isValidEmail(email)) {
        await admin
          .from("import_rows")
          .update({ status: "skipped_invalid", error_message: "Invalid email format" })
          .eq("id", row.id);
        batchSkipped++;
        continue;
      }

      if (!isValidPhone(phone)) {
        await admin
          .from("import_rows")
          .update({ status: "skipped_invalid", error_message: "Phone must be 10 digits" })
          .eq("id", row.id);
        batchSkipped++;
        continue;
      }

      // Check duplicate by email within company
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("company_id", cid)
        .eq("email", email)
        .limit(1)
        .maybeSingle();

      if (existing) {
        await admin
          .from("import_rows")
          .update({ status: "skipped_duplicate", error_message: "Email already exists" })
          .eq("id", row.id);
        batchSkipped++;
        continue;
      }

      // Create user via admin auth (same pattern as app/api/customers/route.ts)
      const { data: newUser, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password: Math.random().toString(36).slice(-12),
          user_metadata: { full_name: fullName, role: "customer" },
          email_confirm: true,
        });

      if (createError) {
        await admin
          .from("import_rows")
          .update({ status: "error", error_message: createError.message })
          .eq("id", row.id);
        batchErrors++;
        continue;
      }

      // Update profile with company_id, phone, address, import_id
      await admin
        .from("profiles")
        .update({
          company_id: cid,
          phone,
          address,
          city,
          state,
          zip,
          import_id: importId,
        })
        .eq("id", newUser.user.id);

      // Ensure email preferences (inherits drip defaults)
      await ensureEmailPreferences(newUser.user.id, admin);

      // Send welcome email if enabled and within throttle
      if (importRecord.send_welcome && companyData) {
        const canSend = await canSendEmail(cid, "welcome_import", admin);
        if (canSend) {
          sendTransactionalEmail({
            template: "welcome",
            to: email,
            props: {
              customerName: fullName,
              dashboardUrl: `${baseUrl}/dashboard`,
              companyName: companyData.name,
              logoUrl: companyData.logo_url,
              primaryColor: (settings.brandColor as string) || "#6366f1",
            },
            companyId: cid,
            customerId: newUser.user.id,
            preferences: null,
            adminClient: admin,
          }).catch(() => {});
          await logEmailSend(cid, "welcome_import", newUser.user.id, admin);
        }
      }

      // Mark row as created
      await admin
        .from("import_rows")
        .update({ status: "created", profile_id: newUser.user.id })
        .eq("id", row.id);

      batchCreated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await admin
        .from("import_rows")
        .update({ status: "error", error_message: message })
        .eq("id", row.id);
      batchErrors++;
    }
  }

  // Update import counters
  const { data: updated } = await admin
    .from("customer_imports")
    .update({
      processed_rows: importRecord.processed_rows + pendingRows.length,
      created_count: importRecord.created_count + batchCreated,
      skipped_count: importRecord.skipped_count + batchSkipped,
      error_count: importRecord.error_count + batchErrors,
    })
    .eq("id", importId)
    .select("*")
    .single();

  // Check if more rows remain
  const { count: remainingCount } = await admin
    .from("import_rows")
    .select("*", { count: "exact", head: true })
    .eq("import_id", importId)
    .eq("status", "pending");

  const hasMore = (remainingCount ?? 0) > 0;

  if (!hasMore && updated) {
    await admin
      .from("customer_imports")
      .update({ status: "completed" })
      .eq("id", importId);
    if (updated) updated.status = "completed";
  }

  return NextResponse.json({ data: updated, hasMore });
}
