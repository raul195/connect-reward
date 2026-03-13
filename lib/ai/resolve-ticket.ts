import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/sendEmail";
import type { SupportTicket, Profile, Company } from "@/lib/types";

interface AIResolution {
  canResolve: boolean;
  resolution: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  analysis: string;
}

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey });
}

export async function resolveTicket(ticket: SupportTicket): Promise<void> {
  const admin = createAdminClient();

  // Fetch customer profile
  const { data: customer } = await admin
    .from("profiles")
    .select("*")
    .eq("id", ticket.profile_id)
    .single();

  if (!customer) {
    console.error(`Customer not found for ticket ${ticket.id}`);
    return;
  }

  // Fetch company info
  const { data: company } = await admin
    .from("businesses")
    .select("*")
    .eq("id", ticket.company_id)
    .single();

  if (!company) {
    console.error(`Company not found for ticket ${ticket.id}`);
    return;
  }

  const profile = customer as Profile;
  const companyData = company as Company;

  // Call Claude for analysis
  const aiResult = await analyzeTicket(ticket, profile, companyData);

  if (aiResult.canResolve && aiResult.resolution) {
    // Auto-resolve the ticket
    await admin
      .from("support_tickets")
      .update({
        status: "resolved",
        resolution: aiResult.resolution,
        resolved_at: new Date().toISOString(),
        resolved_by: "ai",
        ai_analysis: aiResult.analysis,
        priority: aiResult.priority,
      })
      .eq("id", ticket.id);

    // Send resolution email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const branding = companyData.branding as Record<string, string> | null;

    await sendTransactionalEmail({
      template: "ticket_resolved",
      to: profile.email,
      props: {
        customerName: profile.full_name,
        ticketSubject: ticket.subject,
        resolution: aiResult.resolution,
        dashboardUrl: `${baseUrl}/dashboard/support`,
        companyName: companyData.name,
        logoUrl: companyData.logo_url,
        primaryColor: branding?.primaryColor || "#0D9488",
      },
      companyId: companyData.id,
      customerId: profile.id,
      preferences: profile.notification_preferences,
      adminClient: admin,
    });

    console.log(`Ticket ${ticket.id} auto-resolved by AI`);
  } else {
    // Triage only — save analysis and suggested priority
    await admin
      .from("support_tickets")
      .update({
        ai_analysis: aiResult.analysis,
        priority: aiResult.priority,
      })
      .eq("id", ticket.id);

    console.log(`Ticket ${ticket.id} triaged by AI (priority: ${aiResult.priority})`);
  }
}

async function analyzeTicket(
  ticket: SupportTicket,
  customer: Profile,
  company: Company
): Promise<AIResolution> {
  const client = getAnthropicClient();

  const prompt = `You are a support agent for "${company.name}", a referral/loyalty program platform.

A customer has submitted a support ticket. Analyze it and decide if you can auto-resolve it.

**Auto-resolvable categories** (provide a helpful resolution):
- Account questions (how to update profile, change email, etc.)
- Email preferences (how to manage notifications)
- Points inquiries (how points work, checking balance, tier info)
- How-to questions (submitting referrals, redeeming rewards, etc.)

**Triage only** (do NOT auto-resolve, just analyze and suggest priority):
- Bug reports
- Billing issues
- Feature requests
- Anything you're uncertain about
- Complaints requiring human empathy

Customer context:
- Name: ${customer.full_name}
- Tier: ${customer.tier}
- Points: ${customer.total_points}
- Referrals: ${customer.referral_count}

Ticket:
- Category: ${ticket.category}
- Subject: ${ticket.subject}
- Description: ${ticket.description}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "canResolve": true/false,
  "resolution": "Your helpful response to the customer" or null,
  "priority": "low" | "medium" | "high" | "urgent",
  "analysis": "Brief internal analysis for admins about this ticket"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const result: AIResolution = JSON.parse(text);

    // Validate the response shape
    if (
      typeof result.canResolve !== "boolean" ||
      !["low", "medium", "high", "urgent"].includes(result.priority) ||
      typeof result.analysis !== "string"
    ) {
      throw new Error("Invalid AI response shape");
    }

    return result;
  } catch (error) {
    console.error("AI analysis failed for ticket", ticket.id, error);
    // Fallback: don't resolve, keep medium priority
    return {
      canResolve: false,
      resolution: null,
      priority: "medium",
      analysis: "AI analysis failed — requires manual review.",
    };
  }
}
