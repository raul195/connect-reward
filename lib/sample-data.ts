// Static sample data shown to non-demo accounts with no real data yet.
// Matches the response shapes of each API route.

export const sampleAdminDashboard = {
  metrics: {
    activeCustomers: 47,
    referralsThisMonth: 12,
    referralsLastMonth: 9,
    pointsDistributed: 2400,
    totalReferrals: 38,
    completedReferrals: 14,
  },
  pipeline: {
    submitted: 10,
    contacted: 8,
    consultation_scheduled: 6,
    installation_complete: 14,
    cancelled: 0,
  },
  activity: [
    { id: "s1", text: "Sarah M. earned 500 pts — Referral Completed", time: "2 hours ago" },
    { id: "s2", text: "James K. redeemed $25 Amazon Gift Card", time: "5 hours ago" },
    { id: "s3", text: "Maria L. earned 500 pts — Referral Completed", time: "1 day ago" },
    { id: "s4", text: "Robert P. submitted a new referral", time: "2 days ago" },
    { id: "s5", text: "Emily W. reached Silver tier!", time: "3 days ago" },
  ],
};

export const sampleAdminCustomers = {
  customers: [
    { id: "sc1", full_name: "Sarah Martinez", email: "sarah@example.com", phone: "(555) 234-5678", tier: "silver", total_points: 1500, created_at: "2025-01-15T10:00:00Z", role: "customer", company_id: "sample" },
    { id: "sc2", full_name: "James Kim", email: "james@example.com", phone: "(555) 345-6789", tier: "gold", total_points: 3200, created_at: "2024-11-20T10:00:00Z", role: "customer", company_id: "sample" },
    { id: "sc3", full_name: "Maria Lopez", email: "maria@example.com", phone: "(555) 456-7890", tier: "bronze", total_points: 500, created_at: "2025-02-01T10:00:00Z", role: "customer", company_id: "sample" },
    { id: "sc4", full_name: "Robert Patel", email: "robert@example.com", phone: "(555) 567-8901", tier: "platinum", total_points: 8500, created_at: "2024-06-10T10:00:00Z", role: "customer", company_id: "sample" },
    { id: "sc5", full_name: "Emily Wilson", email: "emily@example.com", phone: "(555) 678-9012", tier: "silver", total_points: 1200, created_at: "2025-01-05T10:00:00Z", role: "customer", company_id: "sample" },
    { id: "sc6", full_name: "David Chen", email: "david@example.com", phone: "(555) 789-0123", tier: "bronze", total_points: 250, created_at: "2025-02-20T10:00:00Z", role: "customer", company_id: "sample" },
  ],
  total: 6,
};

export const sampleAdminReferrals = {
  referrals: [
    { id: "sr1", referral_name: "Michael Brown", referral_email: "michael@example.com", referral_phone: "(555) 111-2222", status: "installation_complete", created_at: "2025-01-10T10:00:00Z", points_awarded: 500, referrer_name: "Sarah Martinez", submitted_by: "sc1", service_id: null, service_name: "Solar Panel Installation" },
    { id: "sr2", referral_name: "Jennifer Taylor", referral_email: "jennifer@example.com", referral_phone: "(555) 222-3333", status: "consultation_scheduled", created_at: "2025-02-15T10:00:00Z", points_awarded: 0, referrer_name: "James Kim", submitted_by: "sc2", service_id: null, service_name: "Roof Replacement" },
    { id: "sr3", referral_name: "Chris Anderson", referral_email: "chris@example.com", referral_phone: "(555) 333-4444", status: "contacted", created_at: "2025-02-20T10:00:00Z", points_awarded: 0, referrer_name: "Robert Patel", submitted_by: "sc4", service_id: null, service_name: "Solar Panel Installation" },
    { id: "sr4", referral_name: "Lisa White", referral_email: "lisa@example.com", referral_phone: "(555) 444-5555", status: "submitted", created_at: "2025-03-01T10:00:00Z", points_awarded: 0, referrer_name: "Emily Wilson", submitted_by: "sc5", service_id: null, service_name: "HVAC Installation" },
    { id: "sr5", referral_name: "Daniel Green", referral_email: "daniel@example.com", referral_phone: "(555) 555-6666", status: "installation_complete", created_at: "2025-01-20T10:00:00Z", points_awarded: 500, referrer_name: "Maria Lopez", submitted_by: "sc3", service_id: null, service_name: "Solar Panel Installation" },
    { id: "sr6", referral_name: "Ashley Harris", referral_email: "ashley@example.com", referral_phone: "(555) 666-7777", status: "cancelled", created_at: "2025-02-05T10:00:00Z", points_awarded: 0, referrer_name: "David Chen", submitted_by: "sc6", service_id: null, service_name: "Roof Replacement" },
  ],
  stats: { total: 6, pending: 1, completed: 2, rate: 33 },
};

export const sampleAdminRewards = {
  rewards: [
    { id: "rw1", company_id: "sample", name: "$25 Amazon Gift Card", description: "Redeem your points for a $25 Amazon e-gift card.", category: "gift_card", points_required: 500, image_url: null, is_active: true, quantity_available: null, created_at: "2025-01-01T10:00:00Z", updated_at: "2025-01-01T10:00:00Z" },
    { id: "rw2", company_id: "sample", name: "$50 Visa Gift Card", description: "A $50 Visa gift card — use it anywhere.", category: "gift_card", points_required: 1000, image_url: null, is_active: true, quantity_available: 20, created_at: "2025-01-01T10:00:00Z", updated_at: "2025-01-01T10:00:00Z" },
    { id: "rw3", company_id: "sample", name: "Branded Tumbler", description: "A premium insulated tumbler with your company logo.", category: "custom", points_required: 300, image_url: null, is_active: true, quantity_available: 50, created_at: "2025-01-01T10:00:00Z", updated_at: "2025-01-01T10:00:00Z" },
    { id: "rw4", company_id: "sample", name: "$100 Service Credit", description: "Apply $100 toward your next service appointment.", category: "service_credit", points_required: 2000, image_url: null, is_active: true, quantity_available: null, created_at: "2025-01-01T10:00:00Z", updated_at: "2025-01-01T10:00:00Z" },
  ],
};

export const sampleAdminReports = {
  metrics: { totalRef: 38, completed: 14, rate: 37, ptsDist: 7000, ptsRedeemed: 1500, activeCust: 47 },
  refOverTime: [
    { date: "1/5", submitted: 3, completed: 1 },
    { date: "1/12", submitted: 5, completed: 2 },
    { date: "1/19", submitted: 4, completed: 2 },
    { date: "1/26", submitted: 6, completed: 3 },
    { date: "2/2", submitted: 4, completed: 1 },
    { date: "2/9", submitted: 7, completed: 3 },
    { date: "2/16", submitted: 5, completed: 2 },
  ],
  funnel: [
    { stage: "Submitted", count: 10 },
    { stage: "Contacted", count: 8 },
    { stage: "Consultation Scheduled", count: 6 },
    { stage: "Installation Complete", count: 14 },
  ],
  topReferrers: [
    { name: "Robert Patel", count: 12 },
    { name: "James Kim", count: 8 },
    { name: "Sarah Martinez", count: 7 },
    { name: "Emily Wilson", count: 5 },
    { name: "Maria Lopez", count: 4 },
  ],
  topRewards: [
    { name: "$25 Amazon Gift Card", count: 8 },
    { name: "Branded Tumbler", count: 5 },
    { name: "$50 Visa Gift Card", count: 3 },
  ],
  activeCustomers: 47,
};

export const sampleAdminTeam = {
  members: [
    { id: "tm1", full_name: "You (Owner)", email: "owner@yourcompany.com", phone: "(555) 100-0001", role: "business_owner", created_at: "2024-06-01T10:00:00Z", company_id: "sample" },
    { id: "tm2", full_name: "Alex Johnson", email: "alex@yourcompany.com", phone: "(555) 100-0002", role: "business", created_at: "2024-09-15T10:00:00Z", company_id: "sample" },
  ],
};

export const sampleCustomerDashboard = {
  profile: {
    id: "sample-cust",
    full_name: "Sample Customer",
    email: "you@example.com",
    total_points: 500,
    tier: "bronze",
    company_id: "sample",
    role: "customer",
  },
  services: [
    { id: "ss1", name: "Solar Panel Installation", description: "Full residential solar setup", points_value: 500, is_active: true, display_order: 0 },
    { id: "ss2", name: "Roof Replacement", description: "Complete roof tear-off and install", points_value: 400, is_active: true, display_order: 1 },
  ],
  transactions: [
    { id: "st1", user_id: "sample-cust", company_id: "sample", type: "referral_completed", amount: 500, description: "Referral Completed — Solar Panel Installation", created_at: "2025-02-10T10:00:00Z" },
    { id: "st2", user_id: "sample-cust", company_id: "sample", type: "signup_bonus", amount: 100, description: "Welcome bonus!", created_at: "2025-01-05T10:00:00Z" },
    { id: "st3", user_id: "sample-cust", company_id: "sample", type: "redemption", amount: -100, description: "Redeemed: Branded Tumbler", created_at: "2025-02-15T10:00:00Z" },
  ],
  stats: {
    totalReferrals: 3,
    completedInstalls: 1,
    pointsThisMonth: 0,
    rewardsRedeemed: 1,
  },
};

export const sampleCustomerReferrals = {
  referrals: [
    { id: "cr1", company_id: "sample", submitted_by: "sample-cust", service_id: "ss1", referral_name: "John Smith", referral_email: "john@example.com", referral_phone: "(555) 111-1111", status: "installation_complete", points_awarded: 500, created_at: "2025-01-20T10:00:00Z", updated_at: "2025-02-10T10:00:00Z" },
    { id: "cr2", company_id: "sample", submitted_by: "sample-cust", service_id: "ss2", referral_name: "Jane Doe", referral_email: "jane@example.com", referral_phone: "(555) 222-2222", status: "consultation_scheduled", points_awarded: 0, created_at: "2025-02-15T10:00:00Z", updated_at: "2025-02-20T10:00:00Z" },
    { id: "cr3", company_id: "sample", submitted_by: "sample-cust", service_id: "ss1", referral_name: "Bob Wilson", referral_email: "bob@example.com", referral_phone: "(555) 333-3333", status: "submitted", points_awarded: 0, created_at: "2025-03-01T10:00:00Z", updated_at: "2025-03-01T10:00:00Z" },
  ],
  services: { ss1: "Solar Panel Installation", ss2: "Roof Replacement" },
};

export const sampleCustomerRewards = {
  rewards: [
    { id: "rw1", company_id: "sample", name: "$25 Amazon Gift Card", description: "Redeem for a $25 Amazon e-gift card.", category: "gift_card", points_required: 500, image_url: null, is_active: true, quantity_available: null, created_at: "2025-01-01T10:00:00Z", updated_at: "2025-01-01T10:00:00Z" },
    { id: "rw2", company_id: "sample", name: "$50 Visa Gift Card", description: "A $50 Visa gift card.", category: "gift_card", points_required: 1000, image_url: null, is_active: true, quantity_available: 20, created_at: "2025-01-01T10:00:00Z", updated_at: "2025-01-01T10:00:00Z" },
    { id: "rw3", company_id: "sample", name: "Branded Tumbler", description: "Insulated tumbler with company logo.", category: "custom", points_required: 300, image_url: null, is_active: true, quantity_available: 50, created_at: "2025-01-01T10:00:00Z", updated_at: "2025-01-01T10:00:00Z" },
    { id: "rw4", company_id: "sample", name: "$100 Service Credit", description: "$100 toward your next service.", category: "service_credit", points_required: 2000, image_url: null, is_active: true, quantity_available: null, created_at: "2025-01-01T10:00:00Z", updated_at: "2025-01-01T10:00:00Z" },
  ],
};

export const sampleCustomerLeaderboard = {
  entries: [
    { id: "lb1", full_name: "Robert Patel", total_points: 8500, tier: "platinum", referral_count: 12 },
    { id: "lb2", full_name: "James Kim", total_points: 3200, tier: "gold", referral_count: 8 },
    { id: "lb3", full_name: "Sarah Martinez", total_points: 1500, tier: "silver", referral_count: 7 },
    { id: "lb4", full_name: "Emily Wilson", total_points: 1200, tier: "silver", referral_count: 5 },
    { id: "lb5", full_name: "Sample Customer", total_points: 500, tier: "bronze", referral_count: 3 },
  ],
  currentUserId: "sample-cust",
};

export const sampleCustomerPoints = {
  transactions: [
    { id: "pt1", user_id: "sample-cust", company_id: "sample", type: "referral_completed", amount: 500, description: "Referral Completed — Solar Panel Installation", reference_id: null, created_at: "2025-02-10T10:00:00Z" },
    { id: "pt2", user_id: "sample-cust", company_id: "sample", type: "signup_bonus", amount: 100, description: "Welcome bonus!", reference_id: null, created_at: "2025-01-05T10:00:00Z" },
    { id: "pt3", user_id: "sample-cust", company_id: "sample", type: "redemption", amount: -100, description: "Redeemed: Branded Tumbler", reference_id: null, created_at: "2025-02-15T10:00:00Z" },
    { id: "pt4", user_id: "sample-cust", company_id: "sample", type: "manual_adjustment", amount: 50, description: "Loyalty bonus from manager", reference_id: null, created_at: "2025-01-20T10:00:00Z" },
    { id: "pt5", user_id: "sample-cust", company_id: "sample", type: "milestone_bonus", amount: 250, description: "Milestone: 3 referrals!", reference_id: null, created_at: "2025-02-10T10:00:00Z" },
  ],
};
