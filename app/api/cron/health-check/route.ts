import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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
    // Call the health endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();

    if (data.status === "degraded" || data.status === "down") {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const failedChecks = Object.entries(data.checks as Record<string, { status: string }>)
          .filter(([, v]) => v.status !== "healthy")
          .map(([k, v]) => `${k}: ${v.status}`)
          .join(", ");

        await resend.emails.send({
          from: "Connect Reward <notifications@connectreward.io>",
          to: adminEmail,
          subject: `[ALERT] System ${data.status}: ${failedChecks}`,
          html: `
            <h2>System Health Alert</h2>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Time:</strong> ${data.timestamp}</p>
            <h3>Check Results</h3>
            <pre>${JSON.stringify(data.checks, null, 2)}</pre>
          `,
        });
      }
    }

    return NextResponse.json({ status: data.status, alerted: data.status !== "healthy" });
  } catch (error) {
    console.error("Health cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = POST;
