export interface IndustryData {
  slug: string;
  name: string;
  headline: string;
  description: string;
  metaDescription: string;
  painPoints: string[];
  benefits: { title: string; text: string }[];
}

export const INDUSTRIES: IndustryData[] = [
  {
    slug: "solar",
    name: "Solar",
    headline: "Referral Rewards Built for Solar Companies",
    description:
      "Solar thrives on trust. When a homeowner sees panels on their neighbor's roof, they want to know who did the job. Connect Reward turns that curiosity into booked appointments.",
    metaDescription:
      "Referral rewards platform for solar companies. Turn happy homeowners into your best lead source with gamified points, tiers, and prizes.",
    painPoints: [
      "Long sales cycles make every qualified lead critical",
      "Homeowners trust neighbor recommendations over ads",
      "Existing referral programs are manual and hard to track",
      "No visibility into which customers are actually referring",
    ],
    benefits: [
      {
        title: "Automate Your Referral Pipeline",
        text: "Customers submit referrals through their own portal. You get notified instantly with contact details — no more sticky notes or lost phone numbers.",
      },
      {
        title: "Reward the Right Behavior",
        text: "Award points when referrals are contacted, when they book consultations, and when installations complete. Multi-stage rewards keep customers engaged throughout your sales cycle.",
      },
      {
        title: "Track Everything",
        text: "See which customers refer the most, which referrals convert, and how your program performs — all from one dashboard.",
      },
    ],
  },
  {
    slug: "roofing",
    name: "Roofing",
    headline: "Referral Rewards Built for Roofing Companies",
    description:
      "A great roofing job speaks for itself — but only if your customer tells someone. Connect Reward makes sure they do, and rewards them when it leads to new business.",
    metaDescription:
      "Referral rewards platform for roofing companies. Gamified points and prizes that turn completed jobs into a steady stream of new leads.",
    painPoints: [
      "Storm seasons create surges that are hard to sustain year-round",
      "Homeowners rarely think about roofing until they need it",
      "Word-of-mouth is your best channel but impossible to track",
      "Paying cash referral bonuses is messy and inconsistent",
    ],
    benefits: [
      {
        title: "Stay Top of Mind Year-Round",
        text: "Points and tier progression keep your customers engaged long after the job is done. When their neighbor needs a roof, your name comes up first.",
      },
      {
        title: "Replace Cash Bonuses with a Real Program",
        text: "Instead of inconsistent cash handouts, give customers a branded portal where they track referrals, earn points, and choose their own rewards.",
      },
      {
        title: "Grow During Every Season",
        text: "A structured referral program generates leads consistently — not just when storms roll through.",
      },
    ],
  },
  {
    slug: "hvac",
    name: "HVAC",
    headline: "Referral Rewards Built for HVAC Companies",
    description:
      "HVAC customers call when something breaks. Connect Reward helps you turn every service call into a long-term relationship that drives referrals year after year.",
    metaDescription:
      "Referral rewards platform for HVAC companies. Turn service calls into repeat referrals with gamified rewards, points, and customer tiers.",
    painPoints: [
      "Service calls are transactional — customers forget you after the repair",
      "Seasonal demand makes consistent lead generation difficult",
      "Maintenance plan customers are your best referrers but have no incentive",
      "Tracking referrals across install and service teams is chaotic",
    ],
    benefits: [
      {
        title: "Turn Service Calls into Referral Sources",
        text: "Every satisfied customer gets a referral portal. Points for referrals give them a reason to remember you the next time a friend complains about their AC.",
      },
      {
        title: "Reward Your Maintenance Customers",
        text: "Customers on maintenance plans are your most loyal base. Give them extra incentives to refer and watch your lead pipeline grow.",
      },
      {
        title: "One Dashboard for Install and Service",
        text: "Track referrals from both sides of your business in one place. See which jobs generate the most word-of-mouth.",
      },
    ],
  },
  {
    slug: "windows",
    name: "Windows",
    headline: "Referral Rewards Built for Window Companies",
    description:
      "New windows are a visible upgrade. When neighbors notice, you want your customer ready to recommend you. Connect Reward makes that happen automatically.",
    metaDescription:
      "Referral rewards platform for window replacement companies. Gamified referral program that turns completed installs into new appointments.",
    painPoints: [
      "High-ticket sales mean every lead counts",
      "Customers love the result but forget to refer",
      "Door-to-door and paid ads are expensive and inconsistent",
      "No way to measure which customers are your best advocates",
    ],
    benefits: [
      {
        title: "Capitalize on Curb Appeal",
        text: "New windows are visible from the street. Give customers an easy way to refer neighbors who notice the upgrade — and reward them when it converts.",
      },
      {
        title: "Lower Your Cost Per Lead",
        text: "Referral leads close at higher rates than cold leads. A structured rewards program generates them at a fraction of the cost of paid advertising.",
      },
      {
        title: "Build a Referral Engine",
        text: "Points, tiers, and a reward store give customers ongoing motivation to refer — not just a one-time ask after installation.",
      },
    ],
  },
  {
    slug: "turf",
    name: "Turf",
    headline: "Referral Rewards Built for Turf & Landscaping Companies",
    description:
      "A beautiful yard gets compliments. Connect Reward turns those compliments into booked jobs by giving your customers an easy, rewarding way to refer their friends and neighbors.",
    metaDescription:
      "Referral rewards platform for turf and landscaping companies. Turn yard compliments into booked jobs with gamified referral rewards.",
    painPoints: [
      "Yard transformations get attention but don't always generate leads",
      "Seasonal work means you need leads locked in before peak season",
      "Social proof is powerful but hard to turn into actual referrals",
      "Tracking who referred whom across crews is difficult",
    ],
    benefits: [
      {
        title: "Turn Compliments into Customers",
        text: "When neighbors ask about the new turf, your customer can share a referral link in seconds. You get the lead, they get the points.",
      },
      {
        title: "Fill Your Schedule Before Peak Season",
        text: "Run point multiplier promotions in the off-season to incentivize referrals and book jobs before your busy months.",
      },
      {
        title: "Reward Repeat Referrers",
        text: "Tier progression rewards customers who refer multiple times. Your best advocates earn bigger rewards as they climb from Bronze to Platinum.",
      },
    ],
  },
  {
    slug: "pest-control",
    name: "Pest Control",
    headline: "Referral Rewards Built for Pest Control Companies",
    description:
      "Pest control is a recurring relationship. Connect Reward helps you leverage that relationship to generate a steady stream of referrals from your happiest customers.",
    metaDescription:
      "Referral rewards platform for pest control companies. Turn recurring customers into a reliable referral channel with points, tiers, and rewards.",
    painPoints: [
      "Recurring customers are loyal but rarely think to refer",
      "Competing with national brands on advertising budgets is tough",
      "Referral asks feel awkward during service visits",
      "No structured way to track or reward referrals",
    ],
    benefits: [
      {
        title: "Leverage Your Recurring Base",
        text: "Customers on monthly or quarterly plans see you regularly. A referral portal with points gives them a passive reason to send friends your way.",
      },
      {
        title: "Compete on Relationships, Not Ad Spend",
        text: "National brands outspend you on ads. But they can't match the trust a neighbor puts in a personal recommendation. Referral rewards make that trust scalable.",
      },
      {
        title: "Remove the Awkwardness",
        text: "No need to ask for referrals in person. Customers manage everything through their portal — submit referrals, track points, and redeem rewards on their own time.",
      },
    ],
  },
];

export const INDUSTRIES_MAP = Object.fromEntries(
  INDUSTRIES.map((i) => [i.slug, i])
);
