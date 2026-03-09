import type { TriggerTemplates } from "./templateLibrary";

export type PromotionEmailType =
  | "promotion_announcement"
  | "promotion_reminder"
  | "promotion_last_chance";

const CAN_SPAM =
  "This email was sent by {{businessName}}. Manage your email preferences: {{unsubscribeUrl}}";

export const PROMOTION_TEMPLATES: Record<PromotionEmailType, TriggerTemplates> = {
  // ── promotion_announcement ─────────────────────
  promotion_announcement: {
    friendly: [
      {
        subject: "{{multiplier}} Points on every referral — {{promotionName}} is here!",
        body: `Hi {{customerName}},

Great news! {{businessName}} just launched {{promotionName}} — and for a limited time, you'll earn {{multiplier}} points on every referral!

This special promotion runs until {{endDate}}, so don't wait too long. Head to your dashboard and start referring today!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "{{customerName}}, earn {{multiplier}} points starting now!",
        body: `Hey {{customerName}},

We're excited to announce {{promotionName}}! Starting right now, every referral you submit earns {{multiplier}} points instead of the usual amount.

This deal lasts until {{endDate}} — that's {{daysRemaining}} days of boosted earning!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "Bonus alert! {{promotionName}} just started!",
        body: `Hi {{customerName}},

Guess what? {{promotionName}} is officially live! That means you earn {{multiplier}} points on every referral until {{endDate}}.

Now's the perfect time to tell your friends and family about {{businessName}}. Let's go!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
    ],
    professional: [
      {
        subject: "{{promotionName}}: Earn {{multiplier}} points per referral",
        body: `Dear {{customerName}},

We are pleased to announce {{promotionName}}, a limited-time promotion from {{businessName}}. During this period, all referral points will be multiplied by {{multiplier}}.

This promotion is active until {{endDate}}. We encourage you to take advantage of this opportunity to maximize your rewards.

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "Limited-time promotion: {{multiplier}} points multiplier",
        body: `Hello {{customerName}},

{{businessName}} is offering a special points promotion. {{promotionName}} provides a {{multiplier}} multiplier on all referral points earned through {{endDate}}.

Please visit your dashboard to submit referrals and benefit from this enhanced earning rate.

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "{{businessName}} promotion: {{promotionName}} now active",
        body: `Dear {{customerName}},

This message is to inform you that {{promotionName}} is now active. All qualifying referral points will receive a {{multiplier}} multiplier until {{endDate}}.

We value your participation in our referral program and hope you find this promotion beneficial.

{{dashboardUrl}}

${CAN_SPAM}`,
      },
    ],
    motivational: [
      {
        subject: "{{multiplier}} POINTS! {{promotionName}} starts NOW!",
        body: `Hey {{customerName}}!

This is BIG — {{promotionName}} just kicked off and you can earn {{multiplier}} points on EVERY referral! That's right, your points just got a major boost!

You have {{daysRemaining}} days to take advantage. Don't leave points on the table — start referring today!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "{{customerName}}, it's time to EARN BIG!",
        body: `Hi {{customerName}}!

{{promotionName}} is LIVE! Every referral you submit now earns {{multiplier}} points. This is your moment to supercharge your rewards!

The clock is ticking — this special rate ends {{endDate}}. Make every referral count!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "Your points just got a BOOST! {{multiplier}} multiplier!",
        body: `Hey {{customerName}}!

Ready to level up? {{promotionName}} is here, and it means {{multiplier}} points on every referral until {{endDate}}!

This is your chance to reach those rewards faster than ever. Who are you going to refer first?

{{dashboardUrl}}

${CAN_SPAM}`,
      },
    ],
  },

  // ── promotion_reminder ─────────────────────────
  promotion_reminder: {
    friendly: [
      {
        subject: "Halfway there! {{promotionName}} is still going strong",
        body: `Hi {{customerName}},

Just a friendly reminder — {{promotionName}} is at the halfway mark! You still have {{daysRemaining}} days to earn {{multiplier}} points on every referral.

You currently have {{pointsBalance}} points. Why not grow that number while the multiplier is still active?

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "{{customerName}}, don't forget about {{multiplier}} points!",
        body: `Hey {{customerName}},

Quick reminder that {{promotionName}} is still running! You're earning {{multiplier}} points per referral until {{endDate}}.

There's still time to make the most of this boost. Check your dashboard for more details!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "Still earning {{multiplier}} points — {{promotionName}} update",
        body: `Hi {{customerName}},

Just checking in to remind you that {{promotionName}} is still active! Every referral earns {{multiplier}} points until {{endDate}}.

Don't miss this chance to boost your rewards balance — currently sitting at {{pointsBalance}} points!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
    ],
    professional: [
      {
        subject: "{{promotionName}} reminder: {{daysRemaining}} days remaining",
        body: `Dear {{customerName}},

This is a reminder that {{promotionName}} continues to be active. You have {{daysRemaining}} days remaining to earn points at the {{multiplier}} rate.

Your current balance is {{pointsBalance}} points. We encourage you to submit referrals before the promotion concludes on {{endDate}}.

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "Promotion update: {{multiplier}} points still available",
        body: `Hello {{customerName}},

We would like to remind you that the {{promotionName}} promotion is ongoing. The {{multiplier}} points multiplier remains active through {{endDate}}.

Please visit your dashboard to take advantage of this enhanced earning opportunity.

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "{{businessName}} — {{promotionName}} status update",
        body: `Dear {{customerName}},

As a valued participant in our referral program, we wanted to update you on {{promotionName}}. The promotion is currently at its midpoint with {{daysRemaining}} days remaining.

All qualifying referrals continue to receive the {{multiplier}} multiplier until {{endDate}}.

{{dashboardUrl}}

${CAN_SPAM}`,
      },
    ],
    motivational: [
      {
        subject: "Keep going! {{multiplier}} points are still yours!",
        body: `Hey {{customerName}}!

{{promotionName}} is at the halfway point, and the {{multiplier}} multiplier is still going strong! You have {{daysRemaining}} days left to earn at this incredible rate.

Don't slow down now — every referral is worth even more. Keep the momentum going!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "{{customerName}}, the {{multiplier}} boost is still ON!",
        body: `Hi {{customerName}}!

Reminder: {{promotionName}} isn't over yet! You've still got {{daysRemaining}} days of {{multiplier}} points on every referral.

With {{pointsBalance}} points already, imagine how much more you could earn. Let's keep pushing!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "Halfway through — make every referral count!",
        body: `Hey {{customerName}}!

We're halfway through {{promotionName}} and the {{multiplier}} multiplier is still active! {{daysRemaining}} days left to maximize your earnings.

You've been doing great — now finish strong!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
    ],
  },

  // ── promotion_last_chance ──────────────────────
  promotion_last_chance: {
    friendly: [
      {
        subject: "Last chance! {{promotionName}} ends tomorrow!",
        body: `Hi {{customerName}},

Heads up — {{promotionName}} ends tomorrow! After that, points go back to the regular rate. This is your last chance to earn {{multiplier}} points per referral.

If you've been thinking about referring someone, now's the time!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "{{customerName}}, {{multiplier}} points ends soon!",
        body: `Hey {{customerName}},

Just a quick note — {{promotionName}} wraps up tomorrow! The {{multiplier}} points multiplier won't last much longer.

Got someone in mind to refer? Submit your referral today before the promotion ends!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "Final hours of {{promotionName}}!",
        body: `Hi {{customerName}},

The clock is ticking on {{promotionName}}! You have less than a day to earn {{multiplier}} points on your referrals.

Don't let this opportunity slip away — submit a referral before {{endDate}}!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
    ],
    professional: [
      {
        subject: "{{promotionName}} concludes tomorrow — final notice",
        body: `Dear {{customerName}},

This is a final notice that {{promotionName}} will conclude on {{endDate}}. The {{multiplier}} points multiplier will no longer be available after this date.

If you wish to submit referrals at the enhanced rate, please do so at your earliest convenience.

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "Final reminder: {{multiplier}} points promotion ending",
        body: `Hello {{customerName}},

We are writing to inform you that {{promotionName}} will end on {{endDate}}. This is the final day to earn points at the {{multiplier}} rate.

Please visit your dashboard to submit any remaining referrals before the promotion concludes.

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "{{businessName}} — {{promotionName}} ending soon",
        body: `Dear {{customerName}},

As a courtesy, we would like to remind you that {{promotionName}} will expire on {{endDate}}. After this date, referral points will return to the standard rate.

We encourage you to take advantage of the remaining time in this promotion.

{{dashboardUrl}}

${CAN_SPAM}`,
      },
    ],
    motivational: [
      {
        subject: "LAST CALL! {{multiplier}} points ends TOMORROW!",
        body: `Hey {{customerName}}!

This is it — {{promotionName}} ends TOMORROW! After that, the {{multiplier}} multiplier is gone. Don't miss your last chance to earn big!

Submit your referrals NOW and lock in those boosted points!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "{{customerName}}, FINAL HOURS of {{multiplier}} points!",
        body: `Hi {{customerName}}!

The countdown is ON! {{promotionName}} ends tomorrow, and with it goes the {{multiplier}} points multiplier. This is your LAST CHANCE to earn at this incredible rate!

Make it count — who can you refer RIGHT NOW?

{{dashboardUrl}}

${CAN_SPAM}`,
      },
      {
        subject: "Don't miss out! {{promotionName}} ends in hours!",
        body: `Hey {{customerName}}!

Time's almost up on {{promotionName}}! The {{multiplier}} multiplier disappears after {{endDate}}, and you don't want to leave those extra points behind.

One last push — finish strong and earn BIG!

{{dashboardUrl}}

${CAN_SPAM}`,
      },
    ],
  },
};
