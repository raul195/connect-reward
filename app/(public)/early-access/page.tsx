"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type confettiType from "canvas-confetti";
import { Sparkles, Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface FormData {
  // Step 1
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  website: string;
  // Step 2
  industry: string;
  industry_other: string;
  company_size: string;
  current_referral_method: string;
  current_referral_method_other: string;
  monthly_referral_volume: string;
  // Step 3
  biggest_challenge: string;
  desired_plan: string;
  how_did_you_hear: string;
}

const emptyForm: FormData = {
  full_name: "", email: "", phone: "", company_name: "", website: "",
  industry: "", industry_other: "", company_size: "", current_referral_method: "", current_referral_method_other: "", monthly_referral_volume: "",
  biggest_challenge: "", desired_plan: "", how_did_you_hear: "",
};

const INDUSTRIES = [
  { value: "solar", label: "Solar" },
  { value: "roofing", label: "Roofing" },
  { value: "hvac", label: "HVAC" },
  { value: "windows", label: "Windows" },
  { value: "turf", label: "Turf" },
  { value: "pest_control", label: "Pest Control" },
  { value: "other", label: "Other" },
];

const COMPANY_SIZES = [
  { value: "solo", label: "Just me (solo)" },
  { value: "2-5", label: "2-5 employees" },
  { value: "6-15", label: "6-15 employees" },
  { value: "16-50", label: "16-50 employees" },
  { value: "50+", label: "50+ employees" },
];

const REFERRAL_METHODS = [
  { value: "none", label: "We don't have a referral program" },
  { value: "cash_bonuses", label: "Cash bonuses to customers" },
  { value: "gift_cards", label: "Gift cards" },
  { value: "referral_software", label: "Referral software (another platform)" },
  { value: "word_of_mouth", label: "Word of mouth only" },
  { value: "other", label: "Other" },
];

const MONTHLY_VOLUMES = [
  { value: "0", label: "0 — we're just starting" },
  { value: "1-5", label: "1-5" },
  { value: "6-15", label: "6-15" },
  { value: "16-30", label: "16-30" },
  { value: "30+", label: "30+" },
];

const PLANS = [
  { value: "free", label: "Free ($0 — just exploring)" },
  { value: "starter", label: "Starter ($149/mo)" },
  { value: "growth", label: "Growth ($299/mo)" },
  { value: "pro", label: "Pro ($499/mo)" },
  { value: "not_sure", label: "Not sure yet" },
];

function EarlyAccessForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Pre-select plan from URL param
  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan && ["free", "starter", "growth", "pro", "not_sure"].includes(plan)) {
      setForm(f => ({ ...f, desired_plan: plan }));
    }
  }, [searchParams]);

  function update(key: keyof FormData, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setError("");
  }

  function validateStep1() {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!form.company_name.trim()) return "Company name is required.";
    return null;
  }

  function validateStep2() {
    if (!form.industry) return "Please select your industry.";
    if (form.industry === "other" && !form.industry_other.trim()) return "Please specify your industry.";
    if (!form.company_size) return "Please select your company size.";
    if (!form.current_referral_method) return "Please select your current referral method.";
    if (!form.monthly_referral_volume) return "Please select your monthly referral volume.";
    return null;
  }

  function nextStep() {
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
    }
    setError("");
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    // Capture UTM params
    const utm_source = searchParams.get("utm_source") || undefined;
    const utm_medium = searchParams.get("utm_medium") || undefined;
    const utm_campaign = searchParams.get("utm_campaign") || undefined;

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, utm_source, utm_medium, utm_campaign }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "duplicate") {
          setError(data.message);
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      import("canvas-confetti").then(mod => {
        mod.default({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#14b8a6", "#f59e0b", "#8b5cf6", "#3b82f6"] });
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <Check className="h-8 w-8 text-[#0D9488]" />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-[#1A202C]">You&apos;re on the list!</h2>
        <p className="mt-3 text-[#64748B]">
          Thanks for applying, {form.full_name.split(" ")[0]}! We&apos;re reviewing applications and onboarding businesses in batches. You&apos;ll hear from us within 48 hours.
        </p>

        <div className="mx-auto mt-8 max-w-sm text-left">
          <h3 className="font-bold text-[#1A202C]">What happens next?</h3>
          <ol className="mt-3 space-y-3">
            {[
              "We review your application",
              "We'll reach out to schedule a quick intro call",
              "Once approved, you'll get full access to set up your rewards program",
            ].map((txt, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0D9488] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-[#475569]">{txt}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10">
          <Link href="/" className="text-sm font-medium text-[#0D9488] hover:underline">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Progress bar */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex-1">
            <div className={`h-2 rounded-full transition-colors ${s <= step ? "bg-[#0D9488]" : "bg-gray-200"}`} />
            <p className={`mt-1 text-xs ${s <= step ? "font-medium text-[#0D9488]" : "text-[#94A3B8]"}`}>
              {s === 1 ? "About You" : s === 2 ? "Your Business" : "Your Interest"}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 1: About You */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1A202C]">About You</h3>
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="jane@company.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <Input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label>Company Name *</Label>
            <Input value={form.company_name} onChange={e => update("company_name", e.target.value)} placeholder="Apex Plumbing" />
          </div>
          <div className="space-y-2">
            <Label>Company Website</Label>
            <Input value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://..." />
          </div>
        </div>
      )}

      {/* Step 2: Your Business */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1A202C]">Your Business</h3>
          <div className="space-y-2">
            <Label>Industry *</Label>
            <Select value={form.industry} onValueChange={v => update("industry", v)}>
              <SelectTrigger><SelectValue placeholder="Select your industry" /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.industry === "other" && (
              <Input className="mt-2" value={form.industry_other} onChange={e => update("industry_other", e.target.value)} placeholder="Please specify" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Company Size *</Label>
            <div className="space-y-2">
              {COMPANY_SIZES.map(s => (
                <label key={s.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.company_size === s.value ? "border-[#0D9488] bg-teal-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <input type="radio" name="company_size" value={s.value} checked={form.company_size === s.value} onChange={() => update("company_size", s.value)} className="accent-[#0D9488]" />
                  <span className="text-sm">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>How are you currently handling referrals? *</Label>
            <Select value={form.current_referral_method} onValueChange={v => update("current_referral_method", v)}>
              <SelectTrigger><SelectValue placeholder="Select one" /></SelectTrigger>
              <SelectContent>
                {REFERRAL_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.current_referral_method === "other" && (
              <Input className="mt-2" value={form.current_referral_method_other} onChange={e => update("current_referral_method_other", e.target.value)} placeholder="Please specify" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Monthly referral volume *</Label>
            <div className="space-y-2">
              {MONTHLY_VOLUMES.map(v => (
                <label key={v.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.monthly_referral_volume === v.value ? "border-[#0D9488] bg-teal-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <input type="radio" name="monthly_volume" value={v.value} checked={form.monthly_referral_volume === v.value} onChange={() => update("monthly_referral_volume", v.value)} className="accent-[#0D9488]" />
                  <span className="text-sm">{v.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Your Interest */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1A202C]">Your Interest</h3>
          <div className="space-y-2">
            <Label>What&apos;s your biggest challenge with getting referrals?</Label>
            <Textarea
              value={form.biggest_challenge}
              onChange={e => update("biggest_challenge", e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g., We get some referrals but there's no system to track them, customers forget about us after the install..."
            />
            <p className="text-xs text-[#94A3B8]">{form.biggest_challenge.length}/500</p>
          </div>
          <div className="space-y-2">
            <Label>Which plan are you most interested in?</Label>
            <div className="space-y-2">
              {PLANS.map(p => (
                <label key={p.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${form.desired_plan === p.value ? "border-[#0D9488] bg-teal-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <input type="radio" name="desired_plan" value={p.value} checked={form.desired_plan === p.value} onChange={() => update("desired_plan", p.value)} className="accent-[#0D9488]" />
                  <span className="text-sm">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>How did you hear about Connect Reward?</Label>
            <Input value={form.how_did_you_hear} onChange={e => update("how_did_you_hear", e.target.value)} placeholder="e.g., Google search, social media, a friend..." />
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between gap-3">
        {step > 1 ? (
          <Button variant="outline" onClick={() => { setStep(s => s - 1); setError(""); }}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        ) : <div />}

        {step < 3 ? (
          <Button onClick={nextStep} className="bg-[#0D9488] hover:bg-[#0F766E]">
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <>Submit Application <ArrowRight className="ml-1 h-4 w-4" /></>}
          </Button>
        )}
      </div>
    </>
  );
}

export default function EarlyAccessPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal nav */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D9488]">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <span className="text-xl font-bold text-[#1A202C]">Connect Reward</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-[#64748B] hover:text-[#1A202C]">
            Already have an account? Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
            Request Early Access to Connect Reward
          </h1>
          <p className="mt-3 text-[#64748B]">
            Join the waitlist for the referral rewards platform built for home service contractors. We&apos;re onboarding businesses in batches — apply now to reserve your spot.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#64748B]">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#0D9488]" /> Free to apply</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#0D9488]" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#0D9488]" /> Priority for early applicants</span>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg sm:p-8">
          <Suspense fallback={<div className="h-96 animate-pulse rounded bg-muted" />}>
            <EarlyAccessForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
