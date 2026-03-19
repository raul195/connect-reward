import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Find posts that are scheduled for now or earlier and not yet published
    const { data: posts, error } = await admin
      .from("blog_posts")
      .select("id, title, slug")
      .eq("published", false)
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", new Date().toISOString());

    if (error) {
      console.error("Blog publish query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ published: 0 });
    }

    // Publish each scheduled post
    const ids = posts.map((p) => p.id);
    const { error: updateError } = await admin
      .from("blog_posts")
      .update({
        published: true,
        published_at: new Date().toISOString(),
        scheduled_at: null,
      })
      .in("id", ids);

    if (updateError) {
      console.error("Blog publish update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`Published ${posts.length} scheduled blog post(s):`, posts.map((p) => p.slug).join(", "));

    return NextResponse.json({ published: posts.length });
  } catch (error) {
    console.error("Blog publish cron error:", error);
    return NextResponse.json({ error: "Failed to publish posts" }, { status: 500 });
  }
}

export const GET = POST;
