import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const { data: notifications } = await admin
    .from("notifications")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ notifications: notifications ?? [] });
}

export async function PUT(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.markAll === true) {
    // Mark all unread notifications as read
    const { error } = await admin
      .from("notifications")
      .update({ is_read: true })
      .eq("profile_id", profile.id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json(
        { error: "Failed to mark notifications as read: " + error.message },
        { status: 500 }
      );
    }
  } else if (body.id) {
    // Mark single notification as read
    const { error } = await admin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", String(body.id))
      .eq("profile_id", profile.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to mark notification as read: " + error.message },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Provide 'id' or 'markAll: true'." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
