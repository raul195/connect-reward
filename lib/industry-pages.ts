export interface IndustryPageData {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  heroHeading: string;
  heroSubheading: string;
  whyReferralsMatter: string[];
  faq: { question: string; answer: string }[];
  ctaHeading: string;
  testimonials: { name: string; company: string; quote: string }[];
}

export const INDUSTRY_PAGES: Record<string, IndustryPageData> = {
  solar: {
    slug: "solar",
    name: "Solar",
    title: "Referral Rewards Software for Solar Companies — Connect Reward",
    metaDescription:
      "Help your solar customers send you more referrals. Connect Reward is a gamified referral rewards platform built for solar installation companies.",
    heroHeading: "Turn Your Solar Customers Into Your Best Sales Reps",
    heroSubheading:
      "Connect Reward gives solar installation companies a gamified referral rewards program that keeps customers engaged and sending you new leads — long after their panels are installed.",
    whyReferralsMatter: [
      "Solar installations are high-trust, high-ticket purchases. When a homeowner sees their neighbor's panels and asks who installed them, that's your most valuable lead — it comes pre-sold on the concept and pre-trusting your company. The problem is most solar companies reward that referral once with a cash bonus and move on.",
      "Connect Reward turns that one-time transaction into an ongoing relationship. Your customers earn points every time they refer someone, track their progress on a leaderboard, unlock achievement badges, and redeem rewards from a digital catalog — giving them real reasons to keep advocating for your business year after year.",
    ],
    faq: [
      {
        question: "How much should a solar company pay for a referral?",
        answer:
          "Most solar companies offer between 5-10% of their installation margin as a referral reward. On a $25,000 installation with a 30% margin ($7,500 profit), that's $375-$750 per successful referral. Connect Reward calculates this automatically based on your actual margins so you stay profitable on every referred job.",
      },
      {
        question: "How do I get my solar customers to send me referrals?",
        answer:
          "The key is making referrals rewarding and easy. Connect Reward gives customers a portal where they can submit referrals directly, get notified when their referral is approved, and earn points toward gift cards and prizes. Customers who feel recognized and rewarded refer more.",
      },
      {
        question:
          "Can I run a referral program for my solar company for free?",
        answer:
          "Yes. Connect Reward's free plan supports up to 50 customers with referral tracking and a manual rewards catalog — no credit card required to get started.",
      },
      {
        question:
          "What makes Connect Reward different from a cash referral bonus?",
        answer:
          "Cash bonuses are forgettable. Once a customer spends their check, there's no reason to refer again. Connect Reward creates an ongoing rewards program with points, leaderboards, and badges that keep customers motivated to keep sending referrals month after month.",
      },
    ],
    ctaHeading: "Ready to grow your solar business through referrals?",
    testimonials: [
      {
        name: "Mike R.",
        company: "SunPower Installations",
        quote:
          "Our referral numbers tripled in the first quarter. Customers actually compete on the leaderboard now — it's become a real talking point at neighborhood barbecues.",
      },
      {
        name: "Jennifer L.",
        company: "Valley Solar Co",
        quote:
          "We used to hand out referral checks and hope for the best. Now our customers have a real reason to keep sending us leads month after month.",
      },
      {
        name: "David K.",
        company: "Bright Future Solar",
        quote:
          "The automated follow-up emails save us hours every week. We went from tracking referrals in a spreadsheet to having everything in one dashboard.",
      },
    ],
  },

  roofing: {
    slug: "roofing",
    name: "Roofing",
    title: "Referral Rewards Software for Roofing Companies — Connect Reward",
    metaDescription:
      "Get more roofing jobs through customer referrals. Connect Reward is a gamified referral rewards platform built for roofing contractors.",
    heroHeading: "More Roofing Jobs From the Customers You Already Have",
    heroSubheading:
      "Connect Reward gives roofing companies a referral rewards program that motivates happy customers to send their neighbors your way — with points, leaderboards, and automated follow-up.",
    whyReferralsMatter: [
      "When a roof gets replaced, the whole street notices. That's your best marketing moment — a visible, completed job that your customer's neighbors can see every day. Most roofing companies leave that opportunity on the table.",
      "Connect Reward gives your customers a reason to point their neighbors your way, tracks every referral automatically, and rewards them with points they actually care about — not just a check they'll forget in a week.",
    ],
    faq: [
      {
        question: "How much should a roofing company pay for a referral?",
        answer:
          "Most roofing contractors offer 5-12% of their job margin as a referral reward. On a $12,000 roof replacement with a 35% margin ($4,200 profit), that's $210-$500 per successful referral. Connect Reward calculates this based on your actual margins so every referral stays profitable.",
      },
      {
        question: "How do I get roofing customers to refer their neighbors?",
        answer:
          "Make it easy and rewarding. Connect Reward gives customers a portal where they submit referrals directly, get notified when their referral becomes a job, and earn points toward gift cards and prizes. Customers who feel appreciated refer more.",
      },
      {
        question: "Do roofing referral programs actually work?",
        answer:
          "Yes — referrals are consistently the highest-converting lead source for roofing companies. A referred customer already trusts you before the first call. The challenge is most roofing companies don't have a structured program to generate referrals consistently. Connect Reward solves that.",
      },
      {
        question:
          "Can I track which customers are sending me the most referrals?",
        answer:
          "Yes. Connect Reward's dashboard shows every referral, who submitted it, and its current status. A built-in leaderboard shows your top referrers so you know exactly who your best advocates are.",
      },
    ],
    ctaHeading: "Ready to turn your roofing customers into your sales team?",
    testimonials: [
      {
        name: "Tom B.",
        company: "Heritage Roofing",
        quote:
          "We replaced three roofs on the same street last quarter — all from one customer's referrals. The leaderboard creates real motivation.",
      },
      {
        name: "Sarah M.",
        company: "Summit Roofing Co",
        quote:
          "Connect Reward turned our happiest customers into our marketing department. We spend less on ads and get better leads.",
      },
      {
        name: "Carlos G.",
        company: "Reliable Roof Solutions",
        quote:
          "The points system is genius. Our customers actually remember to refer us now because they're working toward something.",
      },
    ],
  },

  hvac: {
    slug: "hvac",
    name: "HVAC",
    title: "Referral Rewards Software for HVAC Companies — Connect Reward",
    metaDescription:
      "Grow your HVAC business through customer referrals. Connect Reward is a gamified referral rewards platform built for HVAC contractors and home comfort companies.",
    heroHeading: "Grow Your HVAC Business One Referral at a Time",
    heroSubheading:
      "Connect Reward helps HVAC companies build a steady stream of referred leads from their happiest customers — with points, rewards, and automated follow-up that runs itself.",
    whyReferralsMatter: [
      "HVAC is a relationship business. When a homeowner's system goes down in the middle of summer, they don't Google — they call the company their neighbor recommended. That trust is earned, not bought with ads.",
      "Connect Reward helps you systematically tap into your existing customer base to generate more of those trusted referrals. Instead of hoping customers remember to mention you, you give them a real reason to — points, leaderboards, and rewards that make referring your company feel worth their time.",
    ],
    faq: [
      {
        question: "How much should an HVAC company pay for a referral?",
        answer:
          "Most HVAC companies offer 8-15% of their job margin as a referral reward. On a $8,000 system installation with a 40% margin ($3,200 profit), that's $256-$480 per successful referral. Connect Reward calculates the right reward based on your actual margins.",
      },
      {
        question: "How do I get HVAC customers to refer their friends?",
        answer:
          "Timing and incentive are everything. Connect Reward sends automated follow-up emails after a job is completed inviting customers to join your rewards program. Customers submit referrals through their portal and earn points every time one is approved.",
      },
      {
        question:
          "Can Connect Reward work for both residential and commercial HVAC?",
        answer:
          "Yes. You can set up different service types with different job values and reward levels — so a commercial installation referral earns significantly more points than a residential repair referral.",
      },
      {
        question: "What happens when a referred HVAC lead doesn't convert?",
        answer:
          "You stay in control. You review and approve every referral before points are awarded. If a lead doesn't convert or isn't qualified, you simply don't approve it — no points are deducted from your account.",
      },
    ],
    ctaHeading: "Ready to build a referral engine for your HVAC business?",
    testimonials: [
      {
        name: "James W.",
        company: "Comfort Air Systems",
        quote:
          "We installed 14 systems last month from referrals alone. Connect Reward made it easy for our customers to send us their neighbors.",
      },
      {
        name: "Linda P.",
        company: "All Seasons HVAC",
        quote:
          "The badge system is surprisingly effective. Our customers love earning achievements — it keeps them engaged between service calls.",
      },
      {
        name: "Robert H.",
        company: "Cool Breeze Heating & Air",
        quote:
          "We used to lose track of who referred who. Now everything is in one place and our customers can see their rewards in real time.",
      },
    ],
  },

  "pest-control": {
    slug: "pest-control",
    name: "Pest Control",
    title:
      "Referral Rewards Software for Pest Control Companies — Connect Reward",
    metaDescription:
      "Get more pest control customers through referrals. Connect Reward is a gamified referral rewards platform built for pest control businesses.",
    heroHeading: "Your Best Pest Control Leads Come From Happy Customers",
    heroSubheading:
      "Connect Reward gives pest control companies a structured referral rewards program that turns satisfied customers into a consistent source of new business.",
    whyReferralsMatter: [
      "Pest control is one of the highest-margin home service businesses — and one of the most referral-driven. When a neighbor solves their rodent or termite problem, they tell everyone on the street. That word-of-mouth is incredibly powerful, but most pest control companies never capture it systematically.",
      "Connect Reward gives your customers a portal to submit referrals directly, earn points for every successful one, and redeem rewards they actually want — turning casual word-of-mouth into a reliable referral engine.",
    ],
    faq: [
      {
        question:
          "How much should a pest control company pay for a referral?",
        answer:
          "Pest control margins are typically 50-70%, making it one of the most rewarding industries for referral programs. On a $300 general pest treatment with a 60% margin ($180 profit), offering 10% of margin is $18 per referral. For higher-value services like termite treatment, rewards can be significantly higher. Connect Reward calculates this automatically.",
      },
      {
        question:
          "How do referral programs work for recurring pest control services?",
        answer:
          "Connect Reward tracks referrals per service type. You can set different point values for one-time treatments vs recurring service plans — rewarding customers more for referring higher-value ongoing contracts.",
      },
      {
        question:
          "Can I use Connect Reward for both residential and commercial pest control?",
        answer:
          "Yes. You set up your own service types and reward values, so whether you're referring a homeowner for a one-time treatment or a restaurant for a commercial contract, the rewards reflect the actual value of that job.",
      },
      {
        question:
          "How do I get pest control customers to actively refer people?",
        answer:
          "Most customers are happy to refer if you make it easy and rewarding. Connect Reward's leaderboard and badge system create friendly competition among your customers — and automated email reminders keep your program top of mind between service visits.",
      },
    ],
    ctaHeading:
      "Ready to turn your pest control customers into referral machines?",
    testimonials: [
      {
        name: "Amanda T.",
        company: "Guardian Pest Solutions",
        quote:
          "Our customers used to tell their neighbors about us casually. Now they actively submit referrals because they're earning points toward real rewards.",
      },
      {
        name: "Steve C.",
        company: "Hometown Pest Control",
        quote:
          "We added 30 new recurring accounts in our first quarter with Connect Reward. The ROI on this platform is incredible for pest control.",
      },
      {
        name: "Maria L.",
        company: "EcoPest Services",
        quote:
          "The automated emails keep our referral program top of mind between treatments. We don't have to remind customers manually anymore.",
      },
    ],
  },

  windows: {
    slug: "windows",
    name: "Windows",
    title:
      "Referral Rewards Software for Window Replacement Companies — Connect Reward",
    metaDescription:
      "Grow your window replacement business through referrals. Connect Reward is a gamified referral rewards platform built for window and door contractors.",
    heroHeading:
      "New Windows, New Referrals — Grow Your Business Through Happy Customers",
    heroSubheading:
      "Connect Reward helps window replacement companies build a referral rewards program that keeps customers engaged and sending new leads your way.",
    whyReferralsMatter: [
      "New windows are one of the most visible home improvements on the block. When your customer's neighbors notice the upgrade, that's your opportunity.",
      "Connect Reward helps you capture those moments systematically — giving your customers a portal to submit referrals, earn points, and redeem rewards every time they send someone your way. Instead of hoping word-of-mouth happens naturally, you build a system that makes it happen consistently.",
    ],
    faq: [
      {
        question: "How much should a window company pay for a referral?",
        answer:
          "Most window replacement companies offer 6-12% of their job margin as a referral reward. On a $6,000 full window replacement with a 35% margin ($2,100 profit), that's $126-$252 per successful referral. Connect Reward calculates this based on your actual margins.",
      },
      {
        question: "How do I get window customers to refer their neighbors?",
        answer:
          "The best time to ask for a referral is right after a successful installation when satisfaction is highest. Connect Reward's automated email sequence invites customers to join your rewards program at exactly the right moment — while the experience is still fresh.",
      },
      {
        question:
          "Can I offer different rewards for different window services?",
        answer:
          "Yes. You can set up different point values for single window replacements, full home replacements, and door installations — so the reward always reflects the value of the job referred.",
      },
      {
        question:
          "What if a referred customer only wants a quote, not an installation?",
        answer:
          "You control the approval process. Points are only awarded when you approve a referral — so you decide what qualifies. Most businesses award points when a job is completed, not just when a quote is given.",
      },
    ],
    ctaHeading: "Ready to grow your window business through referrals?",
    testimonials: [
      {
        name: "Chris D.",
        company: "Premier Window Co",
        quote:
          "Three of our biggest jobs last quarter came from one customer's referrals. The rewards program gave her a reason to keep recommending us.",
      },
      {
        name: "Karen S.",
        company: "ClearView Windows",
        quote:
          "Our close rate on referred leads is almost double what we get from ads. Connect Reward helps us generate more of those high-quality leads.",
      },
      {
        name: "Anthony M.",
        company: "Hometown Window & Door",
        quote:
          "The setup took 15 minutes and we had our first referral within a week. It's the easiest marketing investment we've ever made.",
      },
    ],
  },

  landscaping: {
    slug: "landscaping",
    name: "Landscaping",
    title:
      "Referral Rewards Software for Landscaping Companies — Connect Reward",
    metaDescription:
      "Grow your landscaping business through customer referrals. Connect Reward is a gamified referral rewards platform built for landscaping and lawn care companies.",
    heroHeading:
      "Beautiful Yards Lead to More Business — If You Have a Referral System",
    heroSubheading:
      "Connect Reward helps landscaping companies turn their happiest customers into a consistent source of new leads — with points, rewards, and automated follow-up.",
    whyReferralsMatter: [
      "A well-maintained lawn is the best advertisement a landscaping company can have. Every neighbor who walks by is a potential customer — but only if your current customers know to send them your way.",
      "Connect Reward gives your customers a real reason to refer: points they can redeem for gift cards and prizes, a leaderboard that recognizes your top advocates, and a simple portal where submitting a referral takes less than a minute.",
    ],
    faq: [
      {
        question:
          "How much should a landscaping company pay for a referral?",
        answer:
          "Most landscaping companies offer 8-15% of their job margin as a referral reward. For recurring lawn care contracts, even a modest reward pays for itself quickly given the lifetime value of a recurring customer. Connect Reward calculates the right reward based on your actual margins.",
      },
      {
        question:
          "Can Connect Reward work for both one-time and recurring landscaping services?",
        answer:
          "Yes. You can set up different service types with different reward values — so a referral for a full landscape design pays more than a referral for a one-time mow. The reward always reflects the value of the job.",
      },
      {
        question:
          "How do I get landscaping customers to refer their neighbors?",
        answer:
          "Your work is visible every week. Connect Reward's automated emails remind customers about your referral program between service visits — keeping it top of mind when their neighbor asks who does their lawn.",
      },
      {
        question: "Do I have to pay for referrals that don't convert?",
        answer:
          "No. You approve every referral before points are awarded. If a lead doesn't become a customer, you simply don't approve it and no points are deducted.",
      },
    ],
    ctaHeading:
      "Ready to grow your landscaping business through referrals?",
    testimonials: [
      {
        name: "Brian K.",
        company: "GreenScape Landscaping",
        quote:
          "We picked up 8 new recurring accounts in our first month. Turns out our customers were happy to refer — they just needed a reason to.",
      },
      {
        name: "Michelle R.",
        company: "Four Seasons Lawn Care",
        quote:
          "The leaderboard is a hit with our customers. They actually talk about their referral rankings when we show up for service.",
      },
      {
        name: "Kevin D.",
        company: "ProTurf Landscaping",
        quote:
          "We used to offer a free mow for referrals. The points system is so much better — customers stay engaged all season long.",
      },
    ],
  },

  "window-washing": {
    slug: "window-washing",
    name: "Window Washing",
    title:
      "Referral Rewards Software for Window Washing Companies — Connect Reward",
    metaDescription:
      "Grow your window washing business through referrals. Connect Reward is a gamified referral rewards platform for window cleaning and pressure washing companies.",
    heroHeading:
      "Crystal Clear Results Deserve a Crystal Clear Referral System",
    heroSubheading:
      "Connect Reward helps window washing companies build a referral rewards program that turns satisfied customers into a steady source of new business.",
    whyReferralsMatter: [
      "Window washing is a high-frequency, high-visibility service. When your customer's home looks spotless, their neighbors notice. That visibility is powerful — but most window washing companies never capitalize on it with a structured referral program.",
      "Connect Reward changes that by giving your customers a portal to submit referrals, earn points toward real rewards, and feel genuinely appreciated for sending business your way.",
    ],
    faq: [
      {
        question:
          "How much should a window washing company pay for a referral?",
        answer:
          "Most window washing companies offer 10-20% of their job margin as a referral reward. Given the recurring nature of the service, even a modest per-referral reward pays off quickly over the lifetime of a new customer. Connect Reward calculates the right amount based on your margins.",
      },
      {
        question:
          "Can I reward customers for referring both residential and commercial window washing clients?",
        answer:
          "Yes. You set up different service types with different reward values — so a commercial building referral earns significantly more points than a residential job.",
      },
      {
        question:
          "How do I remind customers about my referral program between cleanings?",
        answer:
          "On the Starter plan, Connect Reward's automated email system sends referral reminder emails between service visits — keeping your program top of mind without any manual follow-up from you.",
      },
      {
        question:
          "What if a referred customer only books once and doesn't become recurring?",
        answer:
          "You control what qualifies for approval. You can choose to only award points for referrals that book a recurring service, or award points for any completed job — it's your call.",
      },
    ],
    ctaHeading:
      "Ready to build a referral program for your window washing business?",
    testimonials: [
      {
        name: "Tyler J.",
        company: "Crystal Clear Window Washing",
        quote:
          "Our customers love the points system. We've seen a 40% increase in referrals since switching from cash bonuses to Connect Reward.",
      },
      {
        name: "Samantha R.",
        company: "Sparkling Panes Co",
        quote:
          "The automated reminders between cleanings keep our referral program active year-round — even during the slower winter months.",
      },
      {
        name: "Daniel K.",
        company: "ProShine Window Services",
        quote:
          "Setting up different reward values for residential vs commercial was a game changer. Our customers now actively look for commercial referrals.",
      },
    ],
  },

  plumbing: {
    slug: "plumbing",
    name: "Plumbing",
    title: "Referral Rewards Software for Plumbing Companies — Connect Reward",
    metaDescription:
      "Grow your plumbing business through customer referrals. Connect Reward is a gamified referral rewards platform built for plumbing contractors.",
    heroHeading:
      "Your Best Plumbing Leads Come From Customers Who Trust You",
    heroSubheading:
      "Connect Reward helps plumbing companies build a referral rewards program that turns happy customers into a reliable source of new jobs.",
    whyReferralsMatter: [
      "When a pipe bursts or a water heater fails, homeowners don't have time to research — they call whoever their neighbor recommends. That trust-based referral is the highest-converting lead a plumbing company can get.",
      "Connect Reward helps you build a system that generates those referrals consistently — rewarding customers with points and prizes every time they send someone your way, and keeping your company top of mind for when their neighbors need a plumber.",
    ],
    faq: [
      {
        question: "How much should a plumbing company pay for a referral?",
        answer:
          "Most plumbing companies offer 8-15% of their job margin as a referral reward. On a $3,000 water heater installation with a 40% margin ($1,200 profit), that's $96-$180 per successful referral. Connect Reward calculates this based on your margins.",
      },
      {
        question:
          "Can I set different rewards for emergency vs scheduled plumbing jobs?",
        answer:
          "Yes. You can create different service types with different job values and reward levels — so a full repiping referral earns significantly more than a drain cleaning referral.",
      },
      {
        question:
          "How do I get plumbing customers to refer their neighbors?",
        answer:
          "Most satisfied plumbing customers are happy to refer — they just need a reason and a reminder. Connect Reward's automated emails invite customers to join your rewards program after a completed job, when satisfaction is highest.",
      },
      {
        question:
          "What if a referral calls for a small job but becomes a long-term customer?",
        answer:
          "You control what you approve and reward. You can choose to award points based on the initial job value, or set a flat reward for any new customer referral regardless of job size.",
      },
    ],
    ctaHeading:
      "Ready to grow your plumbing business through referrals?",
    testimonials: [
      {
        name: "Greg P.",
        company: "Reliable Plumbing Co",
        quote:
          "We get 3-4 referrals a week now — up from maybe 1 a month. The rewards program gives customers a real incentive to think of us first.",
      },
      {
        name: "Stacy M.",
        company: "FlowRight Plumbing",
        quote:
          "The dashboard makes it easy to see which customers are our best advocates. We can actually thank them personally now.",
      },
      {
        name: "Marcus J.",
        company: "Heritage Plumbing Services",
        quote:
          "Connect Reward pays for itself with a single referral. The ROI is a no-brainer for any plumbing company.",
      },
    ],
  },

  electrical: {
    slug: "electrical",
    name: "Electrical",
    title:
      "Referral Rewards Software for Electrical Contractors — Connect Reward",
    metaDescription:
      "Grow your electrical business through customer referrals. Connect Reward is a gamified referral rewards platform built for electricians and electrical contractors.",
    heroHeading: "Power Up Your Referrals With a System That Works",
    heroSubheading:
      "Connect Reward helps electrical contractors build a referral rewards program that motivates happy customers to send new jobs your way — automatically.",
    whyReferralsMatter: [
      "Electrical work is high-stakes and high-trust. Homeowners don't hire an electrician they found randomly — they hire one their neighbor vouches for. That word-of-mouth trust is your most powerful marketing tool, but most electrical contractors never tap into it systematically.",
      "Connect Reward gives your customers a portal to submit referrals, earn points toward real rewards, and feel recognized for being your best advocates.",
    ],
    faq: [
      {
        question:
          "How much should an electrical contractor pay for a referral?",
        answer:
          "Most electrical contractors offer 8-15% of their job margin as a referral reward. On a $5,000 panel upgrade with a 40% margin ($2,000 profit), that's $160-$300 per successful referral. Connect Reward calculates this based on your margins.",
      },
      {
        question:
          "Can I set different rewards for residential vs commercial electrical work?",
        answer:
          "Yes. You set up your own service types with different job values and reward levels — so a commercial wiring referral earns more points than a residential outlet installation.",
      },
      {
        question:
          "How do I get electrical customers to refer their neighbors?",
        answer:
          "Connect Reward's automated email system invites customers to join your rewards program after a completed job. Customers submit referrals through their portal in under a minute — no complicated process required.",
      },
      {
        question:
          "Do referred leads have to become paying customers before I award points?",
        answer:
          "Yes — you approve every referral before points are awarded. You decide what qualifies, whether that's a completed job, a signed contract, or a paid invoice.",
      },
    ],
    ctaHeading:
      "Ready to grow your electrical business through referrals?",
    testimonials: [
      {
        name: "Ryan T.",
        company: "Precision Electrical",
        quote:
          "Our customers now actively look for referral opportunities. The badge system gives them something to work toward beyond just the reward.",
      },
      {
        name: "Laura C.",
        company: "Bright Spark Electric",
        quote:
          "We used to rely 100% on Google Ads for new customers. Now referrals account for nearly a third of our business.",
      },
      {
        name: "Paul M.",
        company: "Trusted Wire Electrical",
        quote:
          "The tier system is brilliant. Our top customers love the VIP treatment that comes with Platinum status.",
      },
    ],
  },

  gutters: {
    slug: "gutters",
    name: "Gutters",
    title: "Referral Rewards Software for Gutter Companies — Connect Reward",
    metaDescription:
      "Grow your gutter installation and cleaning business through referrals. Connect Reward is a referral rewards platform built for gutter contractors.",
    heroHeading:
      "More Gutter Jobs From the Customers You've Already Impressed",
    heroSubheading:
      "Connect Reward helps gutter companies build a referral rewards program that turns satisfied customers into a consistent source of new installations and cleanings.",
    whyReferralsMatter: [
      "Gutter work is a neighborhood business. When one home on a street gets new gutters, neighbors with aging systems take notice.",
      "Connect Reward helps you capture that momentum — giving your customers a simple portal to submit referrals and earn points toward rewards they actually want. Instead of hoping word-of-mouth happens on its own, you build a system that makes it happen every time.",
    ],
    faq: [
      {
        question: "How much should a gutter company pay for a referral?",
        answer:
          "Most gutter companies offer 8-15% of their job margin as a referral reward. On a $2,500 gutter installation with a 35% margin ($875 profit), that's $70-$130 per successful referral. Connect Reward calculates the right amount based on your margins.",
      },
      {
        question:
          "Can I offer different rewards for gutter installation vs gutter cleaning?",
        answer:
          "Yes. You set up different service types with different reward values — so a full installation referral earns more points than a seasonal cleaning referral.",
      },
      {
        question:
          "How do I remind gutter customers about my referral program?",
        answer:
          "On the Starter plan, Connect Reward's automated email system sends referral reminders between service visits — keeping your program top of mind without any manual follow-up.",
      },
      {
        question:
          "What if a neighbor only wants a cleaning, not a full installation?",
        answer:
          "You control the approval process. You can approve any referral that results in a paid job, regardless of service type — or restrict approvals to higher-value installations only.",
      },
    ],
    ctaHeading:
      "Ready to grow your gutter business through referrals?",
    testimonials: [
      {
        name: "Jeff B.",
        company: "CleanFlow Gutters",
        quote:
          "We did 5 gutter installations on one street last fall — all from one customer's referrals. The rewards program made it happen.",
      },
      {
        name: "Diana R.",
        company: "All Weather Gutter Co",
        quote:
          "Our seasonal cleaning customers now refer year-round because they're always working toward their next reward.",
      },
      {
        name: "Sean K.",
        company: "ProGutter Solutions",
        quote:
          "The ROI is obvious. One referral more than covers a year of the Starter plan. Everything after that is pure profit.",
      },
    ],
  },

  "pool-service": {
    slug: "pool-service",
    name: "Pool Service",
    title:
      "Referral Rewards Software for Pool Service Companies — Connect Reward",
    metaDescription:
      "Grow your pool service and maintenance business through referrals. Connect Reward is a referral rewards platform built for pool cleaning and repair companies.",
    heroHeading: "Keep the Referrals Flowing All Season Long",
    heroSubheading:
      "Connect Reward helps pool service companies build a referral rewards program that turns loyal customers into a steady source of new recurring accounts.",
    whyReferralsMatter: [
      "Pool service is a recurring revenue business — and recurring revenue businesses live or die by customer retention and referrals. A referred pool customer is more likely to stay long-term, pay on time, and refer again.",
      "Connect Reward helps you systematically grow your recurring account base through your happiest existing customers — rewarding them with points and prizes every time they send someone your way.",
    ],
    faq: [
      {
        question:
          "How much should a pool service company pay for a referral?",
        answer:
          "For recurring pool service, think in terms of lifetime value. A new monthly maintenance customer worth $200/month is worth $2,400 per year. Offering $50-$100 in rewards for that referral is an excellent return. Connect Reward calculates rewards based on your actual job values and margins.",
      },
      {
        question:
          "Can I offer higher rewards for recurring service referrals vs one-time repairs?",
        answer:
          "Yes. You set different reward values for different service types — so referring a new weekly maintenance account earns significantly more points than referring a one-time repair job.",
      },
      {
        question:
          "How do I keep pool service customers engaged with my referral program year-round?",
        answer:
          "Connect Reward's automated email system and points-based engagement — leaderboards, badges, tier progression — keep customers engaged even during the off-season when they're not actively using their pool.",
      },
      {
        question:
          "What if a referred customer only needs a one-time pool opening or closing?",
        answer:
          "You control what qualifies. You can approve all referrals that result in paid work, or restrict approvals to recurring service accounts only — whatever makes sense for your business model.",
      },
    ],
    ctaHeading:
      "Ready to grow your pool service business through referrals?",
    testimonials: [
      {
        name: "Rick M.",
        company: "AquaCare Pool Service",
        quote:
          "We added 12 new weekly maintenance accounts in one summer — all from referrals. The lifetime value of those accounts is incredible.",
      },
      {
        name: "Denise W.",
        company: "Crystal Pool Maintenance",
        quote:
          "Our customers stay engaged with the referral program even in winter. The badges and tier system keep them motivated year-round.",
      },
      {
        name: "Jason L.",
        company: "BlueWave Pool Co",
        quote:
          "The difference between a cash bonus and a rewards program is night and day. Our referral volume went up 3x in the first season.",
      },
    ],
  },

  painting: {
    slug: "painting",
    name: "Painting",
    title:
      "Referral Rewards Software for Painting Companies — Connect Reward",
    metaDescription:
      "Grow your painting business through customer referrals. Connect Reward is a gamified referral rewards platform built for interior and exterior painting contractors.",
    heroHeading:
      "Fresh Paint, Fresh Referrals — Grow Your Painting Business Through Happy Customers",
    heroSubheading:
      "Connect Reward helps painting companies build a referral rewards program that motivates satisfied customers to send their neighbors your way.",
    whyReferralsMatter: [
      "A freshly painted home is impossible to miss. When your customer's exterior gets a stunning new coat, the whole neighborhood notices — and some of them are thinking about doing the same thing.",
      "Connect Reward helps you capture that moment systematically, giving your customers a portal to submit referrals and earn points toward real rewards every time they send someone your way.",
    ],
    faq: [
      {
        question: "How much should a painting company pay for a referral?",
        answer:
          "Most painting contractors offer 8-15% of their job margin as a referral reward. On a $4,000 exterior paint job with a 35% margin ($1,400 profit), that's $112-$210 per successful referral. Connect Reward calculates this based on your margins.",
      },
      {
        question:
          "Can I offer different rewards for interior vs exterior painting referrals?",
        answer:
          "Yes. You set up different service types with different reward values — so a full exterior referral earns more points than an interior room referral.",
      },
      {
        question:
          "How do I get painting customers to refer their neighbors?",
        answer:
          "Timing is everything. Connect Reward's automated emails invite customers to join your referral program right after a completed job — when their satisfaction and enthusiasm are at their peak.",
      },
      {
        question:
          "What if a referred customer wants a quote but doesn't book a job?",
        answer:
          "You control the approval process. Points are only awarded when you approve a referral — so you decide whether a quote, a deposit, or a completed job is required before rewarding your customer.",
      },
    ],
    ctaHeading:
      "Ready to grow your painting business through referrals?",
    testimonials: [
      {
        name: "Eric H.",
        company: "ProCoat Painting",
        quote:
          "We painted three houses on the same cul-de-sac last month — all referrals from one customer. The rewards program creates real momentum.",
      },
      {
        name: "Teresa M.",
        company: "Fresh Finish Painters",
        quote:
          "Our customers are more engaged than ever. They actually check their points balance and plan their next referral. It's incredible.",
      },
      {
        name: "Nathan K.",
        company: "ColorPro Painting Co",
        quote:
          "The automated follow-up emails do all the heavy lifting. We focus on painting — Connect Reward handles the referral program.",
      },
    ],
  },
};

export const INDUSTRY_NAV_LIST = [
  { name: "Electrical", slug: "electrical" },
  { name: "Gutters", slug: "gutters" },
  { name: "HVAC", slug: "hvac" },
  { name: "Landscaping", slug: "landscaping" },
  { name: "Painting", slug: "painting" },
  { name: "Pest Control", slug: "pest-control" },
  { name: "Plumbing", slug: "plumbing" },
  { name: "Pool Service", slug: "pool-service" },
  { name: "Roofing", slug: "roofing" },
  { name: "Solar", slug: "solar" },
  { name: "Window Washing", slug: "window-washing" },
  { name: "Windows", slug: "windows" },
];
