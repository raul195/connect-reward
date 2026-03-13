"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Sun, Home, Wind, Bug, SquareStack, HelpCircle, Plus, X, ArrowRight, ArrowLeft, Check, Loader2, CreditCard, Shield } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// ── Types ──

interface IndustryOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ServiceEntry {
  id: string;
  name: string;
  industry: string;
  job_value: number;
  margin: number;
  referral_percentage: number;
}

const MARGIN_RANGES: Record<string, { low: number; high: number; label: string }> = {
  solar: { low: 20, high: 35, label: "Solar: typically 20–35%" },
  roofing: { low: 25, high: 40, label: "Roofing: typically 25–40%" },
  hvac: { low: 30, high: 50, label: "HVAC: typically 30–50%" },
  pest_control: { low: 50, high: 70, label: "Pest Control: typically 50–70%" },
  windows: { low: 30, high: 45, label: "Windows: typically 30–45%" },
  other: { low: 20, high: 50, label: "Other: typically 20–50%" },
};

interface ReviewPlatform {
  id: string;
  name: string;
  icon: string;
  defaultPoints: number;
  note?: string;
}

// ── Constants ──

const INDUSTRIES: IndustryOption[] = [
  { id: "solar", label: "Solar", icon: <Sun className="h-6 w-6" /> },
  { id: "roofing", label: "Roofing", icon: <Home className="h-6 w-6" /> },
  { id: "hvac", label: "HVAC", icon: <Wind className="h-6 w-6" /> },
  { id: "pest_control", label: "Pest Control", icon: <Bug className="h-6 w-6" /> },
  { id: "windows", label: "Windows", icon: <SquareStack className="h-6 w-6" /> },
  { id: "other", label: "Other", icon: <HelpCircle className="h-6 w-6" /> },
];

const SERVICE_SUGGESTIONS: Record<string, { name: string; value: number }[]> = {
  solar: [
    { name: "Full System Installation", value: 25000 },
    { name: "Panel Upgrade", value: 12000 },
    { name: "Battery Add-on", value: 8000 },
    { name: "Solar Inspection", value: 500 },
  ],
  roofing: [
    { name: "Full Roof Replacement", value: 15000 },
    { name: "Roof Repair", value: 3000 },
    { name: "Gutter Installation", value: 2000 },
    { name: "Roof Inspection", value: 400 },
  ],
  hvac: [
    { name: "New System Installation", value: 10000 },
    { name: "AC Repair", value: 1500 },
    { name: "Furnace Replacement", value: 6000 },
    { name: "Annual Tune-up", value: 200 },
  ],
  pest_control: [
    { name: "General Pest Treatment", value: 300 },
    { name: "Termite Treatment", value: 2000 },
    { name: "Rodent Control", value: 500 },
    { name: "Mosquito Treatment", value: 400 },
  ],
  windows: [
    { name: "Full Window Replacement", value: 12000 },
    { name: "Single Window Replacement", value: 1200 },
    { name: "Window Repair", value: 400 },
    { name: "Screen Replacement", value: 150 },
  ],
};

const REVIEW_PLATFORMS: ReviewPlatform[] = [
  { id: "google", name: "Google", icon: "⭐", defaultPoints: 500, note: "Google reviews have the highest impact on local search rankings" },
  { id: "yelp", name: "Yelp", icon: "🔴", defaultPoints: 300 },
  { id: "bbb", name: "BBB", icon: "🏛️", defaultPoints: 300 },
  { id: "facebook", name: "Facebook", icon: "👍", defaultPoints: 300 },
];

const BILLING_STEP = 5;
const SUMMARY_STEP = 6;
const MAX_STEPS = 6;

let nextId = 0;
function uid() {
  return `svc-${++nextId}-${Date.now()}`;
}

// ── Component ──

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Step 1
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [otherIndustry, setOtherIndustry] = useState("");

  // Step 2
  const [services, setServices] = useState<ServiceEntry[]>([]);

  // Step 3 — referral percentages are stored on each service entry

  // Step 4
  const [reviewRewards, setReviewRewards] = useState<Record<string, number>>(() =>
    Object.fromEntries(REVIEW_PLATFORMS.map((p) => [p.id, p.defaultPoints]))
  );

  // Step 5 — Billing
  const [planTier, setPlanTier] = useState<string>("free");
  const [planName, setPlanName] = useState<string>("Free");
  const [planPrice, setPlanPrice] = useState<string>("$0");
  const [billingComplete, setBillingComplete] = useState(false);

  // Whether to show the billing step (non-free plan + Stripe configured)
  const showBilling = planTier !== "free" && !!stripePromise;
  const totalSteps = showBilling ? MAX_STEPS : MAX_STEPS - 1;

  // Map visual step to actual step (skip billing step for free plans)
  function actualStep(visualStep: number): number {
    if (showBilling) return visualStep;
    // If billing is hidden, visual step 5 maps to actual step 6 (summary)
    if (visualStep >= BILLING_STEP) return visualStep + 1;
    return visualStep;
  }

  const currentActualStep = actualStep(step);

  // Check if already onboarded
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/onboarding");
      if (!res.ok) return;
      const { data } = await res.json();
      if (data?.onboarding_completed) {
        router.replace("/admin");
        return;
      }
      if (data?.plan_tier) {
        setPlanTier(data.plan_tier);
        if (data.plan_tier === "beta") {
          setPlanName("Beta");
          setPlanPrice("$99/mo");
        }
      }
    } catch {
      // ignore
    }
    setCheckingStatus(false);
  }, [router]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // ── Step navigation ──

  function canProceed(): boolean {
    switch (currentActualStep) {
      case 1:
        return selectedIndustries.length > 0 && (!selectedIndustries.includes("other") || otherIndustry.trim().length > 0);
      case 2:
        return services.length > 0 && services.every((s) => s.name.trim() && s.job_value > 0);
      case 3:
        return true;
      case 4:
        return true;
      case BILLING_STEP:
        return billingComplete;
      case SUMMARY_STEP:
        return true;
      default:
        return false;
    }
  }

  function goNext() {
    if (!canProceed()) return;

    // When leaving step 1, initialize services from suggestions for new industries
    if (currentActualStep === 1) {
      const existingIndustries = new Set(services.map((s) => s.industry));
      const newServices = [...services];
      for (const ind of selectedIndustries) {
        if (!existingIndustries.has(ind)) {
          const suggestions = SERVICE_SUGGESTIONS[ind] || [];
          for (const s of suggestions) {
            const defaultMargin = MARGIN_RANGES[ind]
              ? Math.round((MARGIN_RANGES[ind].low + MARGIN_RANGES[ind].high) / 2)
              : 30;
            newServices.push({
              id: uid(),
              name: s.name,
              industry: ind,
              job_value: s.value,
              margin: defaultMargin,
              referral_percentage: 10,
            });
          }
        }
      }
      // Remove services for deselected industries
      const filtered = newServices.filter((s) => selectedIndustries.includes(s.industry));
      setServices(filtered);
    }

    setStep((s) => Math.min(s + 1, totalSteps));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  // ── Step 1 helpers ──

  function toggleIndustry(id: string) {
    setSelectedIndustries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // ── Step 2 helpers ──

  function addService(industry: string) {
    const defaultMargin = MARGIN_RANGES[industry]
      ? Math.round((MARGIN_RANGES[industry].low + MARGIN_RANGES[industry].high) / 2)
      : 30;
    setServices((prev) => [
      ...prev,
      { id: uid(), name: "", industry, job_value: 0, margin: defaultMargin, referral_percentage: 10 },
    ]);
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  function updateService(id: string, field: keyof ServiceEntry, value: string | number) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function addSuggestion(industry: string, name: string, value: number) {
    if (services.some((s) => s.name === name && s.industry === industry)) return;
    const defaultMargin = MARGIN_RANGES[industry]
      ? Math.round((MARGIN_RANGES[industry].low + MARGIN_RANGES[industry].high) / 2)
      : 30;
    setServices((prev) => [
      ...prev,
      { id: uid(), name, industry, job_value: value, margin: defaultMargin, referral_percentage: 10 },
    ]);
  }

  // ── Step 3 helpers ──

  function getProfit(svc: ServiceEntry) {
    return svc.job_value * (svc.margin / 100);
  }

  function getRewardDollars(svc: ServiceEntry) {
    return Math.round(getProfit(svc) * (svc.referral_percentage / 100));
  }

  function getRewardPoints(svc: ServiceEntry) {
    return getRewardDollars(svc) * 100;
  }

  // ── Submit ──

  async function handleSubmit() {
    setSaving(true);
    try {
      const payload = {
        industries: selectedIndustries.map((id) =>
          id === "other" ? otherIndustry.trim() : INDUSTRIES.find((i) => i.id === id)?.label || id
        ),
        services: services.map((s) => ({
          name: s.name,
          industry: s.industry === "other" ? otherIndustry.trim() : INDUSTRIES.find((i) => i.id === s.industry)?.label || s.industry,
          job_value: s.job_value,
          margin_percentage: s.margin,
          referral_percentage: s.referral_percentage,
          points_value: getRewardPoints(s),
        })),
        reviewRewards,
      };

      const res = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
        setSaving(false);
        return;
      }

      toast.success("Your program is live!");
      router.replace("/admin");
    } catch {
      toast.error("Something went wrong");
      setSaving(false);
    }
  }

  // ── Computed values for summary ──

  function getAverageReward() {
    if (services.length === 0) return { points: 0, dollars: 0 };
    const total = services.reduce((sum, s) => sum + getRewardPoints(s), 0);
    return {
      points: Math.round(total / services.length),
      dollars: Math.round(total / services.length / 100),
    };
  }

  // ── Loading ──

  if (checkingStatus) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0D9488]" />
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[#0D9488]">
            <Sparkles className="h-4 w-4" />
            Connect Reward
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-[#0D9488] transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[420px]">
        {currentActualStep === 1 && (
          <StepIndustry
            selected={selectedIndustries}
            onToggle={toggleIndustry}
            otherText={otherIndustry}
            onOtherChange={setOtherIndustry}
          />
        )}
        {currentActualStep === 2 && (
          <StepServices
            industries={selectedIndustries}
            services={services}
            onAddService={addService}
            onRemoveService={removeService}
            onUpdateService={updateService}
            onAddSuggestion={addSuggestion}
            otherLabel={otherIndustry}
          />
        )}
        {currentActualStep === 3 && (
          <StepRewards
            services={services}
            onUpdateService={updateService}
            getProfit={getProfit}
            getRewardDollars={getRewardDollars}
            getRewardPoints={getRewardPoints}
            averageReward={getAverageReward()}
          />
        )}
        {currentActualStep === 4 && (
          <StepReviews
            rewards={reviewRewards}
            onUpdate={(id, val) => setReviewRewards((prev) => ({ ...prev, [id]: val }))}
          />
        )}
        {currentActualStep === BILLING_STEP && (
          <StepBilling
            planName={planName}
            planPrice={planPrice}
            onComplete={() => setBillingComplete(true)}
            isComplete={billingComplete}
          />
        )}
        {currentActualStep === SUMMARY_STEP && (
          <StepSummary
            industries={selectedIndustries.map((id) =>
              id === "other" ? otherIndustry.trim() : INDUSTRIES.find((i) => i.id === id)?.label || id
            )}
            serviceCount={services.length}
            rewardRange={{
              minPts: services.length > 0 ? Math.min(...services.map(getRewardPoints)) : 0,
              maxPts: services.length > 0 ? Math.max(...services.map(getRewardPoints)) : 0,
              minDollars: services.length > 0 ? Math.min(...services.map(getRewardDollars)) : 0,
              maxDollars: services.length > 0 ? Math.max(...services.map(getRewardDollars)) : 0,
            }}
            avgMarginPct={services.length > 0
              ? Math.round(services.reduce((sum, s) => sum + s.referral_percentage, 0) / services.length)
              : 0
            }
            reviewRewards={reviewRewards}
            planName={planName}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t pt-6">
        {step > 1 ? (
          <Button variant="ghost" onClick={goBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < totalSteps ? (
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className="gap-2 bg-[#0D9488] hover:bg-[#0f766e]"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 bg-[#0D9488] hover:bg-[#0f766e]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                Launch My Program
                <Check className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Step Components
// ══════════════════════════════════════════════════════════════

function StepIndustry({
  selected,
  onToggle,
  otherText,
  onOtherChange,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  otherText: string;
  onOtherChange: (v: string) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#1A202C] sm:text-3xl">
        What type of business do you run?
      </h1>
      <p className="mt-2 text-[#64748B]">Select all that apply</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {INDUSTRIES.map((ind) => {
          const active = selected.includes(ind.id);
          return (
            <button
              key={ind.id}
              onClick={() => onToggle(ind.id)}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                active
                  ? "border-[#0D9488] bg-teal-50 text-[#0D9488]"
                  : "border-gray-200 bg-white text-[#64748B] hover:border-gray-300"
              }`}
            >
              {ind.icon}
              <span className="text-sm font-semibold">{ind.label}</span>
            </button>
          );
        })}
      </div>

      {selected.includes("other") && (
        <div className="mt-4">
          <Input
            placeholder="What industry are you in?"
            value={otherText}
            onChange={(e) => onOtherChange(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
    </div>
  );
}

function StepServices({
  industries,
  services,
  onAddService,
  onRemoveService,
  onUpdateService,
  onAddSuggestion,
  otherLabel,
}: {
  industries: string[];
  services: ServiceEntry[];
  onAddService: (industry: string) => void;
  onRemoveService: (id: string) => void;
  onUpdateService: (id: string, field: keyof ServiceEntry, value: string | number) => void;
  onAddSuggestion: (industry: string, name: string, value: number) => void;
  otherLabel: string;
}) {
  function industryLabel(id: string) {
    if (id === "other") return otherLabel || "Other";
    return INDUSTRIES.find((i) => i.id === id)?.label || id;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#1A202C] sm:text-3xl">
        What services do you offer?
      </h1>
      <p className="mt-2 text-[#64748B]">
        Add your services and their average job value. This helps us set up your rewards automatically.
      </p>

      <div className="mt-8 space-y-8">
        {industries.map((ind) => {
          const indServices = services.filter((s) => s.industry === ind);
          const suggestions = SERVICE_SUGGESTIONS[ind] || [];
          const addedNames = new Set(indServices.map((s) => s.name));

          return (
            <div key={ind}>
              <h3 className="text-lg font-bold text-[#1A202C]">{industryLabel(ind)}</h3>

              {/* Quick-add chips */}
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions
                    .filter((s) => !addedNames.has(s.name))
                    .map((s) => (
                      <button
                        key={s.name}
                        onClick={() => onAddSuggestion(ind, s.name, s.value)}
                        className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-[#0D9488] transition-colors hover:bg-teal-100"
                      >
                        + {s.name}
                      </button>
                    ))}
                </div>
              )}

              {/* Service entries */}
              <div className="mt-3 space-y-2">
                {indServices.map((svc) => (
                  <div key={svc.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Service name"
                      value={svc.name}
                      onChange={(e) => onUpdateService(svc.id, "name", e.target.value)}
                      className="flex-1"
                    />
                    <div className="relative w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="Job value"
                        value={svc.job_value || ""}
                        onChange={(e) => onUpdateService(svc.id, "job_value", Number(e.target.value))}
                        className="pl-7"
                      />
                    </div>
                    <button
                      onClick={() => onRemoveService(svc.id)}
                      aria-label={`Remove ${svc.name || "service"}`}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onAddService(ind)}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-[#0D9488] hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add custom service
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepRewards({
  services,
  onUpdateService,
  getProfit,
  getRewardDollars,
  getRewardPoints,
  averageReward,
}: {
  services: ServiceEntry[];
  onUpdateService: (id: string, field: keyof ServiceEntry, value: string | number) => void;
  getProfit: (s: ServiceEntry) => number;
  getRewardDollars: (s: ServiceEntry) => number;
  getRewardPoints: (s: ServiceEntry) => number;
  averageReward: { points: number; dollars: number };
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#1A202C] sm:text-3xl">
        How much will you reward referrals?
      </h1>
      <p className="mt-2 text-[#64748B]">
        Set your profit margin and choose what percentage of profit to offer as a referral reward.
      </p>

      <div className="mt-8 space-y-6">
        {services.map((svc) => {
          const profit = getProfit(svc);
          const rewardDollars = getRewardDollars(svc);
          const rewardPoints = getRewardPoints(svc);
          const marginRange = MARGIN_RANGES[svc.industry] || MARGIN_RANGES.other;
          const isHighReward = svc.referral_percentage > 25;

          return (
            <div key={svc.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#1A202C]">{svc.name}</p>
                <p className="text-sm text-[#64748B]">Job: ${svc.job_value.toLocaleString()}</p>
              </div>

              {/* Margin input */}
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-[#475569]">
                    Profit margin
                  </label>
                  <div className="group relative">
                    <HelpCircle className="h-3.5 w-3.5 text-[#94A3B8] cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 z-10 w-72 rounded-lg border bg-white p-3 text-xs text-[#64748B] shadow-lg">
                      Your margin is your profit after labor, materials, and overhead costs.
                      For example, if a $10,000 job costs you $6,000 to deliver, your margin is 40%.
                      <p className="mt-2 font-medium text-[#475569]">{marginRange.label}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="relative w-24">
                    <Input
                      type="number"
                      value={svc.margin || ""}
                      onChange={(e) => {
                        const v = Math.min(100, Math.max(0, Number(e.target.value)));
                        onUpdateService(svc.id, "margin", v);
                      }}
                      className="pr-7"
                      min={1}
                      max={100}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                  <span className="text-sm text-[#64748B]">
                    = <span className="font-medium text-[#1A202C]">${Math.round(profit).toLocaleString()}</span> profit per job
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  {marginRange.label}
                </p>
              </div>

              {/* Referral reward slider (% of profit) */}
              <div className="mt-5">
                <label className="text-sm font-medium text-[#475569]">
                  Referral reward (% of profit)
                </label>
                <div className="mt-2 flex items-center gap-4">
                  <span className="w-12 text-right text-sm font-bold text-[#0D9488]">
                    {svc.referral_percentage}%
                  </span>
                  <Slider
                    value={[svc.referral_percentage]}
                    onValueChange={([v]) => onUpdateService(svc.id, "referral_percentage", v)}
                    min={1}
                    max={30}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Live calculated values */}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="rounded bg-teal-50 px-2 py-1 font-medium text-[#0D9488]">
                  ${rewardDollars.toLocaleString()} reward
                </span>
                <span className="rounded bg-amber-50 px-2 py-1 font-medium text-amber-600">
                  {rewardPoints.toLocaleString()} points
                </span>
                <span className="rounded bg-gray-100 px-2 py-1 font-medium text-[#64748B]">
                  {svc.referral_percentage}% of profit
                </span>
              </div>

              {/* Profitability guardrail */}
              {isHighReward && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <span className="text-amber-500">⚠️</span>
                  <p className="text-xs text-amber-700">
                    This reward is quite high relative to your margin. Make sure this works for your business.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-[#64748B]">
        Most businesses offer 8–15% of their profit margin as a referral reward. This keeps you profitable on every referred job.
      </p>

      <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 text-center">
        <p className="text-sm text-[#64748B]">Your average referral reward</p>
        <p className="mt-1 text-xl font-bold text-[#0D9488]">
          {averageReward.points.toLocaleString()} points (${averageReward.dollars.toLocaleString()})
        </p>
      </div>
    </div>
  );
}

function StepReviews({
  rewards,
  onUpdate,
}: {
  rewards: Record<string, number>;
  onUpdate: (id: string, val: number) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#1A202C] sm:text-3xl">
        Reward customers for leaving reviews
      </h1>
      <p className="mt-2 text-[#64748B]">
        Reviews build trust and help you rank higher online. Set how many points you&apos;ll award for each platform.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {REVIEW_PLATFORMS.map((platform) => (
          <div
            key={platform.id}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{platform.icon}</span>
              <span className="text-lg font-bold text-[#1A202C]">{platform.name}</span>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-[#64748B]">Points per review</label>
              <Input
                type="number"
                value={rewards[platform.id] || 0}
                onChange={(e) => onUpdate(platform.id, Math.max(0, Number(e.target.value)))}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-[#64748B]">
                = ${((rewards[platform.id] || 0) / 100).toFixed(2)}
              </p>
            </div>

            {platform.note && (
              <p className="mt-3 text-xs font-medium text-[#0D9488]">{platform.note}</p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-[#64748B]">
        Customers will only see review platforms you&apos;ve enabled in settings.
      </p>
    </div>
  );
}

function StepBilling({
  planName,
  planPrice,
  onComplete,
  isComplete,
}: {
  planName: string;
  planPrice: string;
  onComplete: () => void;
  isComplete: boolean;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createSetupIntent() {
      try {
        const res = await fetch("/api/admin/billing/setup-intent", {
          method: "POST",
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Failed to load payment form");
          setLoading(false);
          return;
        }
        const { data } = await res.json();
        setClientSecret(data.clientSecret);
      } catch {
        setError("Failed to load payment form");
      }
      setLoading(false);
    }
    createSetupIntent();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#1A202C] sm:text-3xl">
        Add a payment method
      </h1>
      <p className="mt-2 text-[#64748B]">
        Your card will be charged monthly based on your plan. You won&apos;t be charged until your trial ends.
      </p>

      {/* Plan summary */}
      <div className="mt-6 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 p-4">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-[#0D9488]" />
          <div>
            <p className="font-semibold text-[#1A202C]">{planName} Plan</p>
            <p className="text-sm text-[#64748B]">Billed monthly</p>
          </div>
        </div>
        <p className="text-xl font-bold text-[#1A202C]">{planPrice}</p>
      </div>

      {/* Stripe form */}
      <div className="mt-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#0D9488]" />
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        {clientSecret && stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#0D9488",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <BillingForm onComplete={onComplete} isComplete={isComplete} />
          </Elements>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-[#64748B]">
        <Shield className="h-4 w-4" />
        Payments are securely processed by Stripe. We never store your card details.
      </div>
    </div>
  );
}

function BillingForm({
  onComplete,
  isComplete,
}: {
  onComplete: () => void;
  isComplete: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || isComplete) return;

    setSubmitting(true);
    setError(null);

    const result = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment setup failed");
      setSubmitting(false);
    } else {
      toast.success("Payment method added");
      onComplete();
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      <Button
        type="submit"
        disabled={!stripe || submitting || isComplete}
        className="mt-6 w-full gap-2 bg-[#0D9488] hover:bg-[#0f766e]"
      >
        {isComplete ? (
          <>
            <Check className="h-4 w-4" />
            Card saved
          </>
        ) : submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save payment method"
        )}
      </Button>
    </form>
  );
}

function StepSummary({
  industries,
  serviceCount,
  rewardRange,
  avgMarginPct,
  reviewRewards,
  planName,
}: {
  industries: string[];
  serviceCount: number;
  rewardRange: { minPts: number; maxPts: number; minDollars: number; maxDollars: number };
  avgMarginPct: number;
  reviewRewards: Record<string, number>;
  planName: string;
}) {
  const rewardRangeText = rewardRange.minPts === rewardRange.maxPts
    ? `${rewardRange.minPts.toLocaleString()} points ($${rewardRange.minDollars.toLocaleString()} | ${avgMarginPct}% of margin)`
    : `${rewardRange.minPts.toLocaleString()} – ${rewardRange.maxPts.toLocaleString()} points ($${rewardRange.minDollars.toLocaleString()} – $${rewardRange.maxDollars.toLocaleString()} | ${avgMarginPct}% of margin)`;

  return (
    <div>
      <div className="text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <Check className="h-8 w-8 text-[#0D9488]" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-[#1A202C] sm:text-3xl">
          You&apos;re all set!
        </h1>
        <p className="mt-2 text-[#64748B]">
          Here&apos;s what we&apos;ve configured for your account
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <SummaryRow label="Industries" value={industries.join(", ")} />
        <SummaryRow label="Services configured" value={String(serviceCount)} />
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-[#64748B]">Referral reward range</p>
          <p className="mt-1 text-sm font-bold text-[#1A202C]">{rewardRangeText}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-[#64748B]">Review rewards</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {REVIEW_PLATFORMS.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-[#475569]"
              >
                {p.icon} {p.name}: {(reviewRewards[p.id] || 0).toLocaleString()} pts
              </span>
            ))}
          </div>
        </div>
        <SummaryRow label="Plan" value={planName} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <span className="text-sm font-medium text-[#64748B]">{label}</span>
      <span className="text-sm font-bold text-[#1A202C]">{value}</span>
    </div>
  );
}
