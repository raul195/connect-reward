import { Resend } from "resend";
import { render } from "@react-email/render";
import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationPreferences } from "@/lib/types";

import {
  WelcomeEmail,
  getWelcomeSubject,
} from "./templates/WelcomeEmail";
import {
  ReferralStatusEmail,
  getReferralStatusSubject,
} from "./templates/ReferralStatusEmail";
import {
  PointsEarnedEmail,
  getPointsEarnedSubject,
} from "./templates/PointsEarnedEmail";
import {
  RewardRedeemedEmail,
  getRewardRedeemedSubject,
} from "./templates/RewardRedeemedEmail";
import {
  InactivityEmail,
  getInactivitySubject,
} from "./templates/InactivityEmail";
import {
  PointsCloseToRewardEmail,
  getPointsCloseToRewardSubject,
} from "./templates/PointsCloseToRewardEmail";
import {
  ReferralNudgeEmail,
  getReferralNudgeSubject,
} from "./templates/ReferralNudgeEmail";
import {
  MilestoneEmail,
  getMilestoneSubject,
} from "./templates/MilestoneEmail";
import {
  MonthlyReminderEmail,
  getMonthlyReminderSubject,
} from "./templates/MonthlyReminderEmail";
import {
  PromotionEmail,
  getPromotionSubject,
} from "./templates/PromotionEmail";
import {
  TicketResolvedEmail,
  getTicketResolvedSubject,
} from "./templates/TicketResolvedEmail";
import type { BrandingProps } from "./templates/types";
import type { ReferralStatus, LoyaltyTier } from "@/lib/types";

// ---------- Template definitions ----------

interface TemplateMap {
  welcome: {
    customerName: string;
    dashboardUrl: string;
  } & BrandingProps;
  referral_status: {
    customerName: string;
    referralName: string;
    newStatus: ReferralStatus;
    currentPoints: number;
    dashboardUrl: string;
  } & BrandingProps;
  points_earned: {
    customerName: string;
    pointsEarned: number;
    reason: string;
    totalPoints: number;
    tier: LoyaltyTier;
    nextTier: LoyaltyTier | null;
    pointsToNextTier: number | null;
    rewardsUrl: string;
  } & BrandingProps;
  reward_redeemed: {
    customerName: string;
    rewardName: string;
    pointsSpent: number;
    remainingBalance: number;
    dashboardUrl: string;
  } & BrandingProps;
  inactivity: {
    customerName: string;
    pointsBalance: number;
    daysSinceActivity: number;
    severity: "mild" | "urgent";
    dashboardUrl: string;
  } & BrandingProps;
  points_close_to_reward: {
    customerName: string;
    currentPoints: number;
    rewardName: string;
    rewardCost: number;
    pointsNeeded: number;
    rewardsUrl: string;
  } & BrandingProps;
  referral_nudge: {
    customerName: string;
    referralName: string;
    daysPending: number;
    dashboardUrl: string;
  } & BrandingProps;
  milestone: {
    customerName: string;
    milestoneCount: number;
    bonusPoints: number;
    totalPoints: number;
    dashboardUrl: string;
  } & BrandingProps;
  monthly_reminder: {
    customerName: string;
    totalPoints: number;
    pointsEarnedThisMonth: number;
    referralsThisMonth: number;
    availableRewards: { name: string; pointsRequired: number }[];
    dashboardUrl: string;
  } & BrandingProps;
  promotion_announcement: {
    customerName: string;
    promotionName: string;
    multiplier: number;
    endDate: string;
    daysRemaining: number;
    pointsBalance: number;
    dashboardUrl: string;
    variant: "announcement" | "reminder" | "last_chance";
  } & BrandingProps;
  promotion_reminder: {
    customerName: string;
    promotionName: string;
    multiplier: number;
    endDate: string;
    daysRemaining: number;
    pointsBalance: number;
    dashboardUrl: string;
    variant: "announcement" | "reminder" | "last_chance";
  } & BrandingProps;
  promotion_last_chance: {
    customerName: string;
    promotionName: string;
    multiplier: number;
    endDate: string;
    daysRemaining: number;
    pointsBalance: number;
    dashboardUrl: string;
    variant: "announcement" | "reminder" | "last_chance";
  } & BrandingProps;
  ticket_resolved: {
    customerName: string;
    ticketSubject: string;
    resolution: string;
    dashboardUrl: string;
  } & BrandingProps;
}

export type TemplateName = keyof TemplateMap;

// Template → notification preference key mapping
const PREF_KEY_MAP: Record<TemplateName, keyof NotificationPreferences | null> =
  {
    welcome: null, // transactional, cannot opt out
    referral_status: "referral_status",
    points_earned: "points_earned",
    reward_redeemed: "reward_fulfilled",
    inactivity: "weekly_summary",
    points_close_to_reward: "weekly_summary",
    referral_nudge: "weekly_summary",
    milestone: "milestone_reached",
    monthly_reminder: "weekly_summary",
    promotion_announcement: null,
    promotion_reminder: null,
    promotion_last_chance: null,
    ticket_resolved: null, // transactional
  };

// ---------- Render helpers ----------

function renderTemplate<T extends TemplateName>(
  template: T,
  props: TemplateMap[T]
): { element: React.ReactElement; subject: string } {
  switch (template) {
    case "welcome": {
      const p = props as TemplateMap["welcome"];
      return {
        element: React.createElement(WelcomeEmail, p),
        subject: getWelcomeSubject(p.companyName),
      };
    }
    case "referral_status": {
      const p = props as TemplateMap["referral_status"];
      return {
        element: React.createElement(ReferralStatusEmail, p),
        subject: getReferralStatusSubject(p.referralName, p.newStatus),
      };
    }
    case "points_earned": {
      const p = props as TemplateMap["points_earned"];
      return {
        element: React.createElement(PointsEarnedEmail, p),
        subject: getPointsEarnedSubject(p.pointsEarned),
      };
    }
    case "reward_redeemed": {
      const p = props as TemplateMap["reward_redeemed"];
      return {
        element: React.createElement(RewardRedeemedEmail, p),
        subject: getRewardRedeemedSubject(p.rewardName),
      };
    }
    case "inactivity": {
      const p = props as TemplateMap["inactivity"];
      return {
        element: React.createElement(InactivityEmail, p),
        subject: getInactivitySubject(p.customerName, p.severity),
      };
    }
    case "points_close_to_reward": {
      const p = props as TemplateMap["points_close_to_reward"];
      return {
        element: React.createElement(PointsCloseToRewardEmail, p),
        subject: getPointsCloseToRewardSubject(p.pointsNeeded, p.rewardName),
      };
    }
    case "referral_nudge": {
      const p = props as TemplateMap["referral_nudge"];
      return {
        element: React.createElement(ReferralNudgeEmail, p),
        subject: getReferralNudgeSubject(p.referralName),
      };
    }
    case "milestone": {
      const p = props as TemplateMap["milestone"];
      return {
        element: React.createElement(MilestoneEmail, p),
        subject: getMilestoneSubject(p.milestoneCount),
      };
    }
    case "monthly_reminder": {
      const p = props as TemplateMap["monthly_reminder"];
      return {
        element: React.createElement(MonthlyReminderEmail, p),
        subject: getMonthlyReminderSubject(p.companyName),
      };
    }
    case "promotion_announcement": {
      const p = props as TemplateMap["promotion_announcement"];
      return {
        element: React.createElement(PromotionEmail, { ...p, variant: "announcement" }),
        subject: getPromotionSubject("announcement", p.promotionName, p.multiplier),
      };
    }
    case "promotion_reminder": {
      const p = props as TemplateMap["promotion_reminder"];
      return {
        element: React.createElement(PromotionEmail, { ...p, variant: "reminder" }),
        subject: getPromotionSubject("reminder", p.promotionName, p.multiplier),
      };
    }
    case "promotion_last_chance": {
      const p = props as TemplateMap["promotion_last_chance"];
      return {
        element: React.createElement(PromotionEmail, { ...p, variant: "last_chance" }),
        subject: getPromotionSubject("last_chance", p.promotionName, p.multiplier),
      };
    }
    case "ticket_resolved": {
      const p = props as TemplateMap["ticket_resolved"];
      return {
        element: React.createElement(TicketResolvedEmail, p),
        subject: getTicketResolvedSubject(p.ticketSubject),
      };
    }
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

// ---------- Public API ----------

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface SendOptions<T extends TemplateName> {
  template: T;
  to: string;
  props: TemplateMap[T];
  companyId: string;
  customerId: string | null;
  preferences: NotificationPreferences | null;
  adminClient: SupabaseClient;
  subjectOverride?: string;
}

export async function sendTransactionalEmail<T extends TemplateName>({
  template,
  to,
  props,
  companyId,
  customerId,
  preferences,
  adminClient,
  subjectOverride,
}: SendOptions<T>): Promise<{ success: boolean; skipped?: boolean }> {
  // 1. Check preferences
  const prefKey = PREF_KEY_MAP[template];
  if (prefKey && preferences && preferences[prefKey] === false) {
    logEmail(adminClient, {
      company_id: companyId,
      customer_id: customerId,
      template_name: template,
      recipient_email: to,
      status: "skipped",
      metadata: { reason: "preference_disabled", prefKey },
    });
    return { success: true, skipped: true };
  }

  try {
    // 2. Render React Email → HTML
    const { element, subject } = renderTemplate(template, props);
    const finalSubject = subjectOverride || subject;
    const html = await render(element);

    // 3. Send via Resend
    await getResend().emails.send({
      from: "Connect Reward <notifications@connectreward.io>",
      to,
      subject: finalSubject,
      html,
    });

    // 4. Log success
    logEmail(adminClient, {
      company_id: companyId,
      customer_id: customerId,
      template_name: template,
      recipient_email: to,
      status: "sent",
      metadata: { subject: finalSubject },
    });

    return { success: true };
  } catch (error) {
    console.error(`Email send failed [${template}]:`, error);

    // Log failure
    logEmail(adminClient, {
      company_id: companyId,
      customer_id: customerId,
      template_name: template,
      recipient_email: to,
      status: "failed",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return { success: false };
  }
}

// ---------- Logging (fire-and-forget, never throws) ----------

async function logEmail(
  adminClient: SupabaseClient,
  row: {
    company_id: string;
    customer_id: string | null;
    template_name: string;
    recipient_email: string;
    status: string;
    metadata: Record<string, unknown>;
  }
) {
  try {
    const { error } = await adminClient.from("email_logs").insert(row);
    if (error) console.error("Email log insert failed:", error.message);
  } catch {
    // Silently swallow — logging should never break the app
  }
}
