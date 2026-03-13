import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { isAtLimit, PLAN_LIMITS } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/types";

export async function POST(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireAdmin(profile);
  if (forbidden) return forbidden;

  const cid = profile.company_id!;

  let body: {
    rows: Record<string, string>[];
    mapping: Record<number, string>;
    sendWelcome: boolean;
    filename: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rows, sendWelcome, filename } = body;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  // Check plan limit: current customers + new rows <= limit
  const { data: company } = await admin
    .from("businesses")
    .select("plan_tier")
    .eq("id", cid)
    .single();

  const plan: PlanTier = company?.plan_tier ?? "free";

  const { count: currentCustomers } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", cid)
    .eq("role", "customer");

  const totalAfter = (currentCustomers ?? 0) + rows.length;
  const maxCustomers = PLAN_LIMITS[plan].maxCustomers;
  if (isAtLimit(plan, "customers", totalAfter - 1)) {
    return NextResponse.json(
      {
        error: `Import would exceed your plan limit. You can add ${Math.max(0, maxCustomers - (currentCustomers ?? 0))} more customers.`,
      },
      { status: 403 }
    );
  }

  // Create import record
  const { data: importRecord, error: importError } = await admin
    .from("customer_imports")
    .insert({
      company_id: cid,
      created_by: profile.id,
      status: "pending",
      total_rows: rows.length,
      send_welcome: sendWelcome ?? true,
      original_filename: filename || null,
    })
    .select("id")
    .single();

  if (importError || !importRecord) {
    return NextResponse.json(
      { error: "Failed to create import: " + (importError?.message ?? "unknown") },
      { status: 500 }
    );
  }

  // Bulk insert import_rows
  const importRows = rows.map((row, index) => ({
    import_id: importRecord.id,
    row_number: index + 1,
    raw_data: row,
    status: "pending" as const,
  }));

  // Insert in batches of 100 to avoid payload limits
  for (let i = 0; i < importRows.length; i += 100) {
    const batch = importRows.slice(i, i + 100);
    const { error: rowsError } = await admin.from("import_rows").insert(batch);
    if (rowsError) {
      return NextResponse.json(
        { error: "Failed to insert rows: " + rowsError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ id: importRecord.id }, { status: 201 });
}

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireAdmin(profile);
  if (forbidden) return forbidden;

  const cid = profile.company_id!;

  const { data: imports, error } = await admin
    .from("customer_imports")
    .select("*")
    .eq("company_id", cid)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: imports });
}
