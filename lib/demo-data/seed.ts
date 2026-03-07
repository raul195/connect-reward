import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_EMAIL_DOMAIN, DEMO_COMPANY_SLUG } from "@/lib/demo";
import { DEFAULT_SETTINGS } from "@/lib/points";
import { clearDemoData } from "./clear";

const DEMO_PASSWORD = "DemoTest123!";

const SERVICES = [
  { name: "Full Solar Install", points_value: 500, display_order: 1 },
  { name: "Battery Add-on", points_value: 300, display_order: 2 },
];

const REWARDS = [
  { name: "$25 Gift Card", category: "gift_cards", points_required: 250 },
  { name: "$50 Gift Card", category: "gift_cards", points_required: 500 },
  { name: "Yeti Tumbler", category: "custom", points_required: 300 },
];

const CUSTOMERS = [
  { suffix: 1, name: "Alex Johnson", phone: "5551234001", address: "123 Oak St", city: "Phoenix", state: "AZ", zip: "85001" },
  { suffix: 2, name: "Maria Garcia", phone: "5551234002", address: "456 Pine Ave", city: "Tucson", state: "AZ", zip: "85701" },
  { suffix: 3, name: "James Wilson", phone: "5551234003", address: "789 Elm Dr", city: "Mesa", state: "AZ", zip: "85201" },
  { suffix: 4, name: "Sarah Lee", phone: "5551234004", address: "321 Maple Ln", city: "Chandler", state: "AZ", zip: "85224" },
  { suffix: 5, name: "David Chen", phone: "5551234005", address: "654 Birch Ct", city: "Tempe", state: "AZ", zip: "85281" },
];

const REFEREE_NAMES = [
  "Tom Baker", "Lisa Ray", "Mike Stone",
  "Amy Park", "Chris Fox", "Nina Patel",
  "Jake Moore", "Emma Diaz", "Ryan Kim",
  "Zoe Hart", "Luke Grant", "Mia Cruz",
  "Noah Bell", "Ivy Walsh", "Evan Cole",
];

export async function seedDemoData() {
  const admin = createAdminClient();

  // Idempotent: clear first
  await clearDemoData();

  // 1. Create company
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name: "Demo Solar Co",
      slug: DEMO_COMPANY_SLUG,
      plan_tier: "pro",
      industry: "solar",
      settings: DEFAULT_SETTINGS,
    })
    .select()
    .single();

  if (companyError) throw new Error(`Company creation failed: ${companyError.message}`);
  const companyId = company.id;
  console.log(`Created company: ${company.name} (${companyId})`);

  // 2. Create services
  const { data: services, error: svcError } = await admin
    .from("services")
    .insert(
      SERVICES.map((s) => ({ ...s, company_id: companyId, is_active: true }))
    )
    .select();

  if (svcError) throw new Error(`Services creation failed: ${svcError.message}`);
  console.log(`Created ${services.length} services`);

  // 3. Create rewards
  const { data: rewards, error: rwdError } = await admin
    .from("rewards")
    .insert(
      REWARDS.map((r) => ({ ...r, company_id: companyId, is_active: true }))
    )
    .select();

  if (rwdError) throw new Error(`Rewards creation failed: ${rwdError.message}`);
  console.log(`Created ${rewards.length} rewards`);

  // 4. Create contractor
  const contractorEmail = `demo-contractor${DEMO_EMAIL_DOMAIN}`;
  const { data: contractorUser, error: contractorError } =
    await admin.auth.admin.createUser({
      email: contractorEmail,
      password: DEMO_PASSWORD,
      user_metadata: { full_name: "Demo Contractor", role: "contractor_owner" },
      email_confirm: true,
    });

  if (contractorError) throw new Error(`Contractor creation failed: ${contractorError.message}`);

  // Upsert profile (trigger may not exist in live DB)
  await admin
    .from("profiles")
    .upsert({
      id: contractorUser.user.id,
      email: contractorEmail,
      full_name: "Demo Contractor",
      company_id: companyId,
      role: "contractor_owner",
    });

  console.log(`Created contractor: ${contractorEmail}`);

  // 5. Create customers
  const customerIds: string[] = [];

  for (const c of CUSTOMERS) {
    const email = `demo-customer-${c.suffix}${DEMO_EMAIL_DOMAIN}`;
    const { data: custUser, error: custError } =
      await admin.auth.admin.createUser({
        email,
        password: DEMO_PASSWORD,
        user_metadata: { full_name: c.name, role: "customer" },
        email_confirm: true,
      });

    if (custError) throw new Error(`Customer ${c.suffix} creation failed: ${custError.message}`);

    // Upsert profile (trigger may not exist in live DB)
    await admin
      .from("profiles")
      .upsert({
        id: custUser.user.id,
        email,
        full_name: c.name,
        company_id: companyId,
        role: "customer",
        phone: c.phone,
        address: c.address,
        city: c.city,
        state: c.state,
        zip: c.zip,
      });

    customerIds.push(custUser.user.id);
  }
  console.log(`Created ${customerIds.length} customers`);

  // 6. Create 3 referrals per customer (15 total)
  let refNameIdx = 0;
  const wonReferralIds: string[] = [];

  for (const customerId of customerIds) {
    const statuses = ["submitted", "contacted", "submitted"] as const;

    for (let si = 0; si < statuses.length; si++) {
      const status = statuses[si];
      const serviceIdx = refNameIdx % services.length;
      const refName = REFEREE_NAMES[refNameIdx % REFEREE_NAMES.length];
      const { data: referral, error: refError } = await admin
        .from("referrals")
        .insert({
          company_id: companyId,
          submitted_by: customerId,
          referral_name: refName,
          referral_email: `referee-${refNameIdx + 1}@example.com`,
          referral_phone: `555000${String(refNameIdx + 1).padStart(4, "0")}`,
          service_id: services[serviceIdx].id,
          relationship: "friend",
          status,
        })
        .select()
        .single();

      if (refError) throw new Error(`Referral creation failed: ${refError.message}`);

      // The third referral per customer will become "installation_complete"
      if (si === 2) {
        wonReferralIds.push(referral.id);
      }

      refNameIdx++;
    }
  }
  console.log(`Created ${refNameIdx} referrals (${wonReferralIds.length} to be awarded)`);

  // 7. Award points for "installation_complete" referrals
  for (const refId of wonReferralIds) {
    // Get the referral to find the service points
    const { data: ref } = await admin
      .from("referrals")
      .select("*, services(points_value)")
      .eq("id", refId)
      .single();

    if (!ref) continue;

    const pointsValue = (ref.services as { points_value: number } | null)?.points_value ?? 500;

    // Update referral to installation_complete
    const { error: wonErr } = await admin
      .from("referrals")
      .update({ status: "installation_complete", points_awarded: pointsValue })
      .eq("id", refId);
    if (wonErr) console.error(`  Status update failed for ${refId}:`, wonErr.message);

    // Award points transaction
    const { error: txErr } = await admin.from("point_transactions").insert({
      user_id: ref.submitted_by,
      company_id: companyId,
      type: "referral_completed",
      amount: pointsValue,
      description: `Referral completed: ${ref.referral_name}`,
      reference_id: refId,
    });
    if (txErr) console.error(`  Tx insert failed:`, txErr.message);

    // Update profile total_points and tier
    const { data: profile } = await admin
      .from("profiles")
      .select("total_points")
      .eq("id", ref.submitted_by)
      .single();

    if (profile) {
      const newTotal = profile.total_points + pointsValue;
      const newTier = newTotal >= 7500 ? "platinum" : newTotal >= 3000 ? "gold" : newTotal >= 1000 ? "silver" : "bronze";
      await admin
        .from("profiles")
        .update({ total_points: newTotal, tier: newTier, referral_count: 1 })
        .eq("id", ref.submitted_by);
    }
  }
  console.log(`Awarded points for ${wonReferralIds.length} won referrals`);

  // 8. Create 2 fulfilled redemptions (customers 1 and 2)
  for (let i = 0; i < 2; i++) {
    const userId = customerIds[i];
    const reward = rewards[i]; // $25 and $50 gift cards

    const { data: redemption, error: redError } = await admin
      .from("redemptions")
      .insert({
        user_id: userId,
        reward_id: reward.id,
        company_id: companyId,
        points_spent: reward.points_required,
        status: "fulfilled",
      })
      .select()
      .single();

    if (redError) throw new Error(`Redemption creation failed: ${redError.message}`);

    // Deduct points
    await admin.from("point_transactions").insert({
      user_id: userId,
      company_id: companyId,
      type: "redemption",
      amount: -reward.points_required,
      description: `Redeemed: ${reward.name}`,
      reference_id: redemption.id,
    });

    // Update profile points
    const { data: profile } = await admin
      .from("profiles")
      .select("total_points, redeemed_points")
      .eq("id", userId)
      .single();

    if (profile) {
      await admin
        .from("profiles")
        .update({
          total_points: Math.max(0, profile.total_points - reward.points_required),
          redeemed_points: (profile.redeemed_points || 0) + reward.points_required,
        })
        .eq("id", userId);
    }
  }
  console.log("Created 2 fulfilled redemptions");

  console.log("\nDemo data seeded successfully!");
  console.log(`Contractor: demo-contractor${DEMO_EMAIL_DOMAIN} / ${DEMO_PASSWORD}`);
  console.log(`Customers:  demo-customer-{1-5}${DEMO_EMAIL_DOMAIN} / ${DEMO_PASSWORD}`);
}
