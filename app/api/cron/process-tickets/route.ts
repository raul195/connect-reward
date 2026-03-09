import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTicket } from "@/lib/ai/resolve-ticket";
import type { SupportTicket } from "@/lib/types";

export const dynamic = "force-dynamic";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Fetch up to 10 open tickets without AI analysis
    const { data: tickets, error } = await admin
      .from("support_tickets")
      .select("*")
      .eq("status", "open")
      .is("ai_analysis", null)
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Failed to fetch tickets:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ processed: 0, message: "No tickets to process" });
    }

    let processed = 0;
    let failed = 0;

    for (const ticket of tickets as SupportTicket[]) {
      try {
        await resolveTicket(ticket);
        processed++;
      } catch (err) {
        console.error(`Failed to process ticket ${ticket.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({ processed, failed, total: tickets.length });
  } catch (error) {
    console.error("Process tickets cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = POST;
