import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-helpers";
import { checkAndAwardAchievements } from "@/lib/achievements-engine";
import { Resend } from "resend";

export async function GET() {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { user, profile, admin } = result.ctx;

  // Get user's referrals (scoped to their company)
  const { data: referrals } = await admin
    .from("referrals")
    .select("*")
    .eq("submitted_by", user.id)
    .eq("company_id", profile.company_id!)
    .order("created_at", { ascending: false });

  // Get services for company to build name map
  const { data: services } = await admin
    .from("services")
    .select("id, name")
    .eq("company_id", profile.company_id!);

  const nameMap: Record<string, string> = {};
  for (const s of services ?? []) {
    nameMap[s.id] = s.name;
  }

  return NextResponse.json({
    referrals: referrals ?? [],
    services: nameMap,
  });
}

export async function POST(request: NextRequest) {
  const result = await getAuthContext();
  if (result.error) return result.error;
  const { user, profile, admin } = result.ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referralName = String(body.referral_name || "").trim();
  const referralEmail = String(body.referral_email || "").trim().toLowerCase();
  const referralPhone = String(body.referral_phone || "").trim();
  const serviceId = body.service_id ? String(body.service_id) : null;
  const notes = body.notes ? String(body.notes).trim() : null;
  const serviceType = body.service_type ? String(body.service_type) : null;

  if (!referralName || !referralEmail || !referralPhone) {
    return NextResponse.json(
      { error: "Referral name, email, and phone are required." },
      { status: 400 }
    );
  }

  // Self-referral check
  if (referralEmail === user.email) {
    return NextResponse.json(
      { error: "You cannot refer yourself." },
      { status: 400 }
    );
  }

  // Duplicate check: same email already referred in this company
  const { count: duplicateCount } = await admin
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("company_id", profile.company_id!)
    .eq("referral_email", referralEmail);

  if ((duplicateCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "This person has already been referred." },
      { status: 400 }
    );
  }

  // Rate limit: max 10 referrals per day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayCount } = await admin
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("submitted_by", user.id)
    .gte("created_at", todayStart.toISOString());

  if ((todayCount ?? 0) >= 10) {
    return NextResponse.json(
      { error: "Daily referral limit reached (10). Please try again tomorrow." },
      { status: 429 }
    );
  }

  // Insert referral
  const { error: insertError } = await admin.from("referrals").insert({
    referral_name: referralName,
    referral_email: referralEmail,
    referral_phone: referralPhone,
    service_id: serviceId,
    service_type: serviceType,
    notes,
    status: "submitted",
    submitted_by: user.id,
    company_id: profile.company_id!,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to submit referral: " + insertError.message },
      { status: 500 }
    );
  }

  // Check achievements (first_referral_submitted, quick_start, etc.)
  checkAndAwardAchievements(user.id, profile.company_id!, admin).catch((err) => console.error("Background task failed:", err));

  // Notify business owner about the new referral (all plans)
  const { data: businessOwner } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("company_id", profile.company_id!)
    .in("role", ["business_owner", "business"])
    .limit(1)
    .single();

  if (businessOwner) {
    const { data: companyData } = await admin
      .from("companies")
      .select("name")
      .eq("id", profile.company_id!)
      .single();

    const resend = new Resend(process.env.RESEND_API_KEY);
    resend.emails.send({
      from: "Connect Reward <notifications@connectreward.io>",
      to: businessOwner.email,
      subject: `New Referral Submitted — ${referralName}`,
      text: `${profile.full_name} just submitted a new referral!\n\nReferred: ${referralName}\nEmail: ${referralEmail}\nPhone: ${referralPhone}${notes ? `\nNotes: ${notes}` : ""}\n\nLog in to review this referral: ${process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io"}/admin/referrals`,
    }).catch((err) => console.error("Referral notification email failed:", err));
  }

  return NextResponse.json({ success: true });
}
