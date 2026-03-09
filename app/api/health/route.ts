import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {};
  let overall: "healthy" | "degraded" | "down" = "healthy";

  // ── DB check ──
  try {
    const start = Date.now();
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1);
    checks.db = { status: error ? "down" : "healthy", latency: Date.now() - start };
    if (error) overall = "down";
  } catch {
    checks.db = { status: "down" };
    overall = "down";
  }

  // ── Auth check ──
  try {
    const start = Date.now();
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.listUsers({ perPage: 1 });
    checks.auth = { status: error ? "down" : "healthy", latency: Date.now() - start };
    if (error && overall !== "down") overall = "degraded";
  } catch {
    checks.auth = { status: "down" };
    if (overall !== "down") overall = "degraded";
  }

  // ── Email check (Resend API key presence) ──
  checks.email = {
    status: process.env.RESEND_API_KEY ? "healthy" : "degraded",
  };
  if (!process.env.RESEND_API_KEY && overall === "healthy") overall = "degraded";

  // Log to system_health_checks
  try {
    const admin = createAdminClient();
    await admin.from("system_health_checks").insert({
      status: overall,
      checks,
    });
  } catch (err) {
    console.error("Failed to log health check:", err);
  }

  const statusCode = overall === "healthy" ? 200 : overall === "degraded" ? 200 : 503;

  return NextResponse.json(
    { status: overall, checks, timestamp: new Date().toISOString() },
    { status: statusCode }
  );
}
