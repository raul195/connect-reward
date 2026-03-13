import { NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";
import type { Company, Profile } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const { id } = await params;

    const { data: ticket, error } = await admin
      .from("support_tickets")
      .select("*, profiles!support_tickets_profile_id_fkey(full_name, email, tier, total_points)")
      .eq("id", id)
      .eq("company_id", cid)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Admin support [id] GET error:", error);
    return NextResponse.json({ error: "Failed to load ticket" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getAuthContext();
    if (result.error) return result.error;
    const { profile, admin } = result.ctx;

    const forbidden = requireAdmin(profile);
    if (forbidden) return forbidden;

    const cid = profile.company_id!;
    const { id } = await params;
    const body = await request.json();
    const { status, priority, resolution } = body;

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (resolution !== undefined) updates.resolution = resolution;

    if (status === "resolved" && resolution) {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = profile.id;
    }

    const { data: ticket, error } = await admin
      .from("support_tickets")
      .update(updates)
      .eq("id", id)
      .eq("company_id", cid)
      .select()
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: "Failed to update ticket" }, { status: 400 });
    }

    // Send resolution email if ticket was resolved
    if (status === "resolved" && resolution) {
      const { data: customer } = await admin
        .from("profiles")
        .select("*")
        .eq("id", ticket.profile_id)
        .single();

      const { data: company } = await admin
        .from("businesses")
        .select("*")
        .eq("id", cid)
        .single();

      if (customer && company) {
        const prof = customer as Profile;
        const comp = company as Company;
        const branding = comp.branding as Record<string, string> | null;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        await sendTransactionalEmail({
          template: "ticket_resolved",
          to: prof.email,
          props: {
            customerName: prof.full_name,
            ticketSubject: ticket.subject,
            resolution,
            dashboardUrl: `${baseUrl}/dashboard/support`,
            companyName: comp.name,
            logoUrl: comp.logo_url,
            primaryColor: branding?.primaryColor || "#0D9488",
          },
          companyId: comp.id,
          customerId: prof.id,
          preferences: prof.notification_preferences,
          adminClient: admin,
        });
      }
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Admin support [id] PUT error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
