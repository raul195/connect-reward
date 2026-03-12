import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireAdmin } from "@/lib/api-helpers";

interface ReviewLinkInput {
  platform: string;
  url: string;
  label?: string;
  display_order: number;
}

const VALID_PLATFORMS = new Set(["google", "yelp", "bbb", "facebook", "trustpilot", "other"]);

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** GET — list all review links for the business */
export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireAdmin(profile);
  if (forbidden) return forbidden;

  const { data: links } = await admin
    .from("business_review_links")
    .select("*")
    .eq("business_id", profile.company_id!)
    .order("display_order", { ascending: true });

  return NextResponse.json({ data: links ?? [] });
}

/** PUT — upsert all review links (replaces all for this business) */
export async function PUT(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { profile, admin } = result.ctx;

  const forbidden = requireAdmin(profile);
  if (forbidden) return forbidden;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const links = body.links as ReviewLinkInput[] | undefined;
  if (!Array.isArray(links)) {
    return NextResponse.json({ error: "links array is required" }, { status: 400 });
  }

  const cid = profile.company_id!;

  // Validate inputs
  for (const link of links) {
    if (!VALID_PLATFORMS.has(link.platform)) {
      return NextResponse.json(
        { error: `Invalid platform: ${link.platform}` },
        { status: 400 }
      );
    }
    if (!isValidUrl(link.url)) {
      return NextResponse.json(
        { error: `Invalid URL for ${link.platform}: ${link.url}` },
        { status: 400 }
      );
    }
  }

  // Delete all existing links for this business, then insert new ones
  await admin
    .from("business_review_links")
    .delete()
    .eq("business_id", cid);

  if (links.length > 0) {
    const rows = links.map((link, i) => ({
      business_id: cid,
      platform: link.platform,
      url: link.url,
      label: link.label || null,
      display_order: link.display_order ?? i,
    }));

    const { error } = await admin
      .from("business_review_links")
      .insert(rows);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Return updated list
  const { data: updated } = await admin
    .from("business_review_links")
    .select("*")
    .eq("business_id", cid)
    .order("display_order", { ascending: true });

  return NextResponse.json({ data: updated ?? [] });
}
