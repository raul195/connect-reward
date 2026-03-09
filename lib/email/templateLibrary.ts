import type { AutomationTriggerType } from "@/lib/types";

export type TonePreference = "friendly" | "professional" | "motivational";

export interface TemplateContent {
  subject: string;
  body: string;
}

export type TriggerTemplates = {
  friendly: [TemplateContent, TemplateContent, TemplateContent];
  professional: [TemplateContent, TemplateContent, TemplateContent];
  motivational: [TemplateContent, TemplateContent, TemplateContent];
};

const CAN_SPAM =
  "This email was sent by {{businessName}}. Manage your preferences in your dashboard.";

export const TEMPLATE_LIBRARY: Record<AutomationTriggerType, TriggerTemplates> =
  {
    // ── inactivity_30 ────────────────────────────────
    inactivity_30: {
      friendly: [
        {
          subject: "Hey {{customerName}}, we miss you!",
          body: `Hi {{customerName}},

It's been a little while since we've seen you around! Just wanted to check in and let you know you still have {{pointsBalance}} points waiting for you.

Why not pop by your dashboard and see what's new? There might be a reward with your name on it.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, your points are waiting for you!",
          body: `Hey {{customerName}},

We noticed it's been about 30 days since your last visit. No worries — your {{pointsBalance}} points are safe and sound!

Swing by anytime to check out the latest rewards or submit a new referral.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Long time no see, {{customerName}}!",
          body: `Hi {{customerName}},

We've been thinking about you! It's been a month since you last stopped by, and we wanted you to know your {{pointsBalance}} points are right where you left them.

Come back and put them to good use — we'd love to see you!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
      professional: [
        {
          subject: "Your {{businessName}} rewards account update",
          body: `Dear {{customerName}},

We wanted to reach out regarding your rewards account with {{businessName}}. Our records show it has been approximately 30 days since your last activity.

Your current balance of {{pointsBalance}} points remains available. We encourage you to visit your dashboard to explore available rewards.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, your rewards balance is waiting",
          body: `Hello {{customerName}},

This is a courtesy reminder that your {{businessName}} rewards account has been inactive for 30 days. Your balance of {{pointsBalance}} points is still intact.

Please visit your dashboard at your convenience to review available rewards and referral opportunities.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Account activity reminder from {{businessName}}",
          body: `Dear {{customerName}},

We are writing to inform you that your rewards account has not seen activity in the past 30 days. Your {{pointsBalance}} points remain available for redemption.

We invite you to log in to your dashboard to view current reward options.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
      motivational: [
        {
          subject: "{{customerName}}, your points are ready for action!",
          body: `Hey {{customerName}}!

You've been away for a bit, but guess what? Your {{pointsBalance}} points are charged up and ready to go!

Don't let them sit idle — jump back in, submit a referral, and watch your rewards grow!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Come back stronger, {{customerName}}!",
          body: `Hi {{customerName}}!

30 days is too long to be away from your rewards! You've got {{pointsBalance}} points just waiting to be put to work.

Every referral brings you closer to something awesome. Let's make it happen!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, your next reward is closer than you think!",
          body: `Hey {{customerName}}!

It's been a month, and we know life gets busy. But here's the exciting part — you have {{pointsBalance}} points and great rewards within reach!

One referral could change everything. Are you ready?

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
    },

    // ── inactivity_60 ────────────────────────────────
    inactivity_60: {
      friendly: [
        {
          subject: "{{customerName}}, we really miss you!",
          body: `Hi {{customerName}},

It's been two months since we last saw you, and we genuinely miss having you around! Your {{pointsBalance}} points are still here, patiently waiting.

There are some great rewards you might be missing out on. Come take a look!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Don't forget about your {{pointsBalance}} points, {{customerName}}!",
          body: `Hey {{customerName}},

Just a friendly heads-up — it's been about 60 days since your last visit. Your {{pointsBalance}} points haven't gone anywhere, but we'd hate for you to miss out on the rewards catalog.

Pop in when you get a chance — we'd love to have you back!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, your rewards are waiting!",
          body: `Hi {{customerName}},

Two months have flown by and we wanted to reach out one more time. You've got {{pointsBalance}} points sitting in your account, and there are some rewards we think you'd really enjoy.

We hope to see you soon!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
      professional: [
        {
          subject: "Important: Your {{businessName}} rewards account",
          body: `Dear {{customerName}},

This is an important notice regarding your {{businessName}} rewards account. It has now been 60 days since your last recorded activity.

Your balance of {{pointsBalance}} points remains available; however, we encourage you to review your account and explore current redemption options at your earliest convenience.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}} — 60-day account inactivity notice",
          body: `Hello {{customerName}},

We are reaching out as your {{businessName}} rewards account has been inactive for approximately 60 days. Your {{pointsBalance}} points balance remains intact.

We recommend logging in to your dashboard to stay informed about available rewards and program updates.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Action recommended: Your rewards account at {{businessName}}",
          body: `Dear {{customerName}},

Your rewards account with {{businessName}} has been inactive for 60 days. We want to ensure you are aware that your {{pointsBalance}} points are still available.

Please visit your dashboard to explore reward options and consider submitting a referral to continue earning.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
      motivational: [
        {
          subject: "{{customerName}}, don't let your points go to waste!",
          body: `Hey {{customerName}}!

It's been 60 days and your {{pointsBalance}} points are calling your name! You've worked hard to earn them — now it's time to make them count.

Jump back in, check out the rewards, and remember: every referral is a step closer to something amazing!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Your rewards journey isn't over, {{customerName}}!",
          body: `Hi {{customerName}}!

Two months away? No problem — your {{pointsBalance}} points are still here, and the rewards are better than ever!

This is your sign to get back in the game. One referral is all it takes to reignite your momentum!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, it's time to claim what's yours!",
          body: `Hey {{customerName}}!

60 days is a long time to leave {{pointsBalance}} points on the table! You've already done the hard work — now come enjoy the rewards.

Your next milestone could be just one referral away. Let's go!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
    },

    // ── points_close_to_reward ───────────────────────
    points_close_to_reward: {
      friendly: [
        {
          subject: "{{customerName}}, you're so close to {{rewardName}}!",
          body: `Hi {{customerName}},

Great news — you're only {{pointsNeeded}} points away from earning {{rewardName}}! With {{pointsBalance}} points in your account, you're almost there.

One more referral could put you over the top. Check out your options!

{{rewardCatalogUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Almost there, {{customerName}}! Just {{pointsNeeded}} more points!",
          body: `Hey {{customerName}},

You're so close to getting your hands on {{rewardName}}! Just {{pointsNeeded}} more points and it's yours.

Why not submit a referral today and make it happen?

{{rewardCatalogUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, {{rewardName}} is within reach!",
          body: `Hi {{customerName}},

Just a quick note to let you know that {{rewardName}} is practically yours! You need just {{pointsNeeded}} more points, and with {{pointsBalance}} already in your account, you're right on the doorstep.

We're rooting for you!

{{rewardCatalogUrl}}

${CAN_SPAM}`,
        },
      ],
      professional: [
        {
          subject: "You're {{pointsNeeded}} points from your next reward",
          body: `Dear {{customerName}},

We are pleased to inform you that you are only {{pointsNeeded}} points away from redeeming {{rewardName}}. Your current balance stands at {{pointsBalance}} points.

We encourage you to visit the rewards catalog to review your options and explore how to earn the remaining points.

{{rewardCatalogUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, your reward is nearly within reach",
          body: `Hello {{customerName}},

Your dedication to the {{businessName}} referral program is paying off. You currently have {{pointsBalance}} points, placing you just {{pointsNeeded}} points away from {{rewardName}}.

Visit the rewards catalog to learn more about earning opportunities.

{{rewardCatalogUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Reward milestone approaching — {{pointsNeeded}} points remaining",
          body: `Dear {{customerName}},

This is a notification that your rewards balance of {{pointsBalance}} points is within {{pointsNeeded}} points of the {{rewardName}} redemption threshold.

Please review the rewards catalog for details on available rewards and earning opportunities.

{{rewardCatalogUrl}}

${CAN_SPAM}`,
        },
      ],
      motivational: [
        {
          subject: "{{customerName}}, you're THIS close to {{rewardName}}!",
          body: `Hey {{customerName}}!

Can you feel it? You're just {{pointsNeeded}} points away from unlocking {{rewardName}}! With {{pointsBalance}} points already banked, the finish line is RIGHT THERE.

One referral could be all you need. Let's make it happen!

{{rewardCatalogUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "So close! {{pointsNeeded}} points to go, {{customerName}}!",
          body: `Hi {{customerName}}!

You've put in the work, you've earned {{pointsBalance}} points, and now {{rewardName}} is practically in your hands! Just {{pointsNeeded}} more points to go.

Don't stop now — the reward is worth it!

{{rewardCatalogUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, the finish line is in sight!",
          body: `Hey {{customerName}}!

{{rewardName}} is calling your name, and with only {{pointsNeeded}} points left to earn, victory is within reach!

You've already proven you can do it with {{pointsBalance}} points earned. Keep that momentum going!

{{rewardCatalogUrl}}

${CAN_SPAM}`,
        },
      ],
    },

    // ── referral_nudge ───────────────────────────────
    referral_nudge: {
      friendly: [
        {
          subject: "Checking in on your referral, {{customerName}}",
          body: `Hi {{customerName}},

Just wanted to give you a quick update — your referral for {{referralName}} has been in progress for {{daysPending}} days now. We're working on it!

In the meantime, did you know you can earn even more points by submitting additional referrals? Every one counts!

{{referralSubmitUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, got another friend to refer?",
          body: `Hey {{customerName}},

While your referral for {{referralName}} is being processed (it's been {{daysPending}} days — we're on it!), why not keep the momentum going?

Each referral you submit brings you closer to your next reward. Know anyone else who could use our services?

{{referralSubmitUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Your referrals are making a difference, {{customerName}}!",
          body: `Hi {{customerName}},

Thanks for referring {{referralName}} — we appreciate you spreading the word! It's been {{daysPending}} days and things are moving along.

If you know anyone else who could benefit from {{businessName}}, we'd love to hear about them!

{{referralSubmitUrl}}

${CAN_SPAM}`,
        },
      ],
      professional: [
        {
          subject: "Referral status update — {{referralName}}",
          body: `Dear {{customerName}},

We wanted to provide an update on your referral for {{referralName}}, submitted {{daysPending}} days ago. The referral is currently being processed.

We appreciate your continued participation in the {{businessName}} referral program. If you have additional referrals to submit, please visit your dashboard.

{{referralSubmitUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, thank you for your referral",
          body: `Hello {{customerName}},

Thank you for your referral of {{referralName}}. As of today, it has been {{daysPending}} days since submission and the process is underway.

Your contributions to our referral program are valued. Should you wish to submit additional referrals, please use the link below.

{{referralSubmitUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Referral program update from {{businessName}}",
          body: `Dear {{customerName}},

This message is to inform you that your referral for {{referralName}} is still being processed after {{daysPending}} days. We appreciate your patience.

As a reminder, each completed referral earns you points toward rewards. Please consider submitting additional referrals through your dashboard.

{{referralSubmitUrl}}

${CAN_SPAM}`,
        },
      ],
      motivational: [
        {
          subject: "Keep the referrals coming, {{customerName}}!",
          body: `Hey {{customerName}}!

Your referral for {{referralName}} is in the pipeline ({{daysPending}} days and counting), and we love your enthusiasm!

Why stop at one? Every referral you submit is another step toward bigger and better rewards. You've got this!

{{referralSubmitUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, you're on a referral roll!",
          body: `Hi {{customerName}}!

While your referral for {{referralName}} makes its way through our process ({{daysPending}} days in), there's no reason to slow down!

Think about it — another referral could push you to your next reward. Who else can you refer today?

{{referralSubmitUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Your referrals = your rewards, {{customerName}}!",
          body: `Hey {{customerName}}!

Just checking in on your referral for {{referralName}} ({{daysPending}} days in progress). Every referral you make is an investment in your rewards balance!

Don't hold back — the more you refer, the more you earn. Let's keep this going!

{{referralSubmitUrl}}

${CAN_SPAM}`,
        },
      ],
    },

    // ── milestone_reached ────────────────────────────
    milestone_reached: {
      friendly: [
        {
          subject: "Congrats, {{customerName}}! {{milestoneCount}} referrals!",
          body: `Hi {{customerName}},

Wow — you just hit {{milestoneCount}} referrals! That's amazing, and we're so grateful for your support.

As a thank you, we've added {{bonusPoints}} bonus points to your account. Your total is now {{totalPoints}} points!

Keep up the great work and check out what rewards you can grab.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, you've reached a milestone!",
          body: `Hey {{customerName}},

What an achievement — {{milestoneCount}} referrals! You've been incredible, and we couldn't be happier to have you in our program.

We've dropped {{bonusPoints}} bonus points into your account as a little celebration. Your balance is now {{totalPoints}} points!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Milestone unlocked! Thank you, {{customerName}}!",
          body: `Hi {{customerName}},

You did it — {{milestoneCount}} referrals complete! Thank you so much for being such an awesome advocate for {{businessName}}.

We've added {{bonusPoints}} bonus points to your account. You now have {{totalPoints}} points to spend on rewards!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
      professional: [
        {
          subject: "Milestone achievement: {{milestoneCount}} referrals completed",
          body: `Dear {{customerName}},

Congratulations on reaching the milestone of {{milestoneCount}} completed referrals with {{businessName}}.

In recognition of this achievement, {{bonusPoints}} bonus points have been credited to your account, bringing your total to {{totalPoints}} points.

We appreciate your continued participation and look forward to your next milestone.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, congratulations on your referral milestone",
          body: `Hello {{customerName}},

We are pleased to acknowledge your achievement of {{milestoneCount}} referrals. Your contributions to the {{businessName}} referral program are highly valued.

A bonus of {{bonusPoints}} points has been added to your account. Your current balance is {{totalPoints}} points.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Referral milestone reached — {{milestoneCount}} referrals",
          body: `Dear {{customerName}},

This message confirms that you have successfully completed {{milestoneCount}} referrals through the {{businessName}} rewards program.

As part of our milestone recognition, {{bonusPoints}} bonus points have been credited to your account for a new total of {{totalPoints}} points. Please visit your dashboard to explore available rewards.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
      motivational: [
        {
          subject: "{{customerName}}, you're a referral CHAMPION!",
          body: `Hey {{customerName}}!

{{milestoneCount}} referrals — are you kidding?! That's absolutely incredible! You're a true champion of the {{businessName}} community.

We just loaded {{bonusPoints}} bonus points into your account. You're now sitting on {{totalPoints}} points! The sky's the limit!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "MILESTONE! {{milestoneCount}} referrals, {{customerName}}!",
          body: `Hi {{customerName}}!

Stop everything — you just hit {{milestoneCount}} referrals! This is HUGE, and you should be incredibly proud.

To celebrate, we've added {{bonusPoints}} bonus points to your account (that's {{totalPoints}} total!). Now imagine where you'll be at the NEXT milestone!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, you're unstoppable!",
          body: `Hey {{customerName}}!

{{milestoneCount}} referrals and counting! Your dedication is truly inspiring, and we can't wait to see what you do next.

Enjoy your {{bonusPoints}} bonus points — your new total of {{totalPoints}} points means amazing rewards are within reach!

Keep being awesome!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
    },

    // ── program_reminder ─────────────────────────────
    program_reminder: {
      friendly: [
        {
          subject: "Your {{periodLabel}} rewards recap from {{businessName}}",
          body: `Hi {{customerName}},

Here's your {{periodLabel}} recap from {{businessName}}! You currently have {{totalPoints}} points in your account.

Don't forget — every referral you submit earns you more points toward great rewards. Check your dashboard to see what's available!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, here's your {{periodLabel}} update!",
          body: `Hey {{customerName}},

Time for your {{periodLabel}} check-in! You have {{totalPoints}} points in your account right now.

Whether you want to redeem a reward or submit a new referral, your dashboard has everything you need. Take a look!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Your {{periodLabel}} summary is here, {{customerName}}!",
          body: `Hi {{customerName}},

Just dropping in with your {{periodLabel}} summary from {{businessName}}! Your current points balance is {{totalPoints}}.

We love having you in our rewards program. Check out the latest rewards and keep those referrals coming!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
      professional: [
        {
          subject: "{{periodLabel}} rewards program summary — {{businessName}}",
          body: `Dear {{customerName}},

Please find below your {{periodLabel}} summary for your {{businessName}} rewards account.

Current points balance: {{totalPoints}}

We encourage you to review the rewards catalog and consider submitting referrals to continue earning points. Visit your dashboard for full details.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, your {{periodLabel}} account summary",
          body: `Hello {{customerName}},

As part of our {{periodLabel}} communications, we are providing an update on your rewards account with {{businessName}}.

Your current balance is {{totalPoints}} points. Please visit your dashboard to view available rewards and referral opportunities.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{businessName}} — {{periodLabel}} rewards report",
          body: `Dear {{customerName}},

This is your scheduled {{periodLabel}} rewards report from {{businessName}}.

Account balance: {{totalPoints}} points

For a detailed breakdown of your activity and available rewards, please log in to your dashboard.

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
      motivational: [
        {
          subject: "{{customerName}}, check out your {{periodLabel}} progress!",
          body: `Hey {{customerName}}!

It's time for your {{periodLabel}} rewards update, and you've got {{totalPoints}} points to show for your efforts!

Every point is a step toward something amazing. Keep referring, keep earning, and keep winning!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "Your {{periodLabel}} rewards update is here!",
          body: `Hi {{customerName}}!

Another {{periodLabel}} update, another chance to celebrate your progress! You're sitting on {{totalPoints}} points right now.

Think about what's next — more referrals, more points, more rewards. The journey is just getting started!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
        {
          subject: "{{customerName}}, keep the momentum going!",
          body: `Hey {{customerName}}!

Your {{periodLabel}} recap is in, and you're doing great with {{totalPoints}} points! But don't stop here — there are even bigger rewards waiting for you.

Every referral counts. Every point matters. Let's make the next {{periodLabel}} your best one yet!

{{dashboardUrl}}

${CAN_SPAM}`,
        },
      ],
    },
  };
