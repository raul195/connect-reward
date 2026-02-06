"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, Send } from "lucide-react";
import type { Service } from "@/lib/types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const RELATIONSHIPS = ["Friend", "Family", "Neighbor", "Coworker", "Other"];

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  serviceId: string;
  relationship: string;
  notes: string;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function StepIndicator({ current }: { current: number }) {
  const labels = ["Contact Info", "Location", "Relationship"];
  return (
    <div className="flex items-center justify-center gap-2">
      {labels.map((label, i) => {
        const step = i + 1;
        const done = current > step;
        const active = current === step;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className={`h-0.5 w-8 sm:w-12 ${done || active ? "bg-teal-500" : "bg-gray-200"}`} />}
            <div className="flex flex-col items-center gap-1">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                done ? "bg-teal-500 text-white" : active ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {done ? <Check className="h-4 w-4" /> : step}
              </span>
              <span className={`hidden text-xs font-medium sm:block ${active ? "text-teal-700" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SubmitReferralPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    serviceId: "",
    relationship: "",
    notes: "",
  });

  const fetchServices = useCallback(async () => {
    if (!profile?.company_id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (data) setServices(data as Service[]);
  }, [profile?.company_id]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!phoneDigits) e.phone = "Phone number is required";
    else if (phoneDigits.length !== 10) e.phone = "Phone must be 10 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (!form.streetAddress.trim()) e.streetAddress = "Street address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state) e.state = "State is required";
    if (!form.zipCode.trim()) e.zipCode = "Zip code is required";
    else if (!/^\d{5}$/.test(form.zipCode)) e.zipCode = "Must be 5 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3(): boolean {
    const e: Record<string, string> = {};
    if (!form.relationship) e.relationship = "Please select a relationship";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  async function handleSubmit() {
    if (!validateStep3()) return;
    if (!profile) return;
    setSubmitting(true);

    const supabase = createClient();

    // Self-referral prevention
    if (form.email.trim().toLowerCase() === profile.email?.toLowerCase()) {
      setErrors({ email: "You cannot refer yourself" });
      setStep(1);
      setSubmitting(false);
      return;
    }

    // Check duplicate email within same company
    const { count: emailDup } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id!)
      .eq("referee_email", form.email.trim().toLowerCase());

    if (emailDup && emailDup > 0) {
      setErrors({ email: "This person has already been referred" });
      setStep(1);
      setSubmitting(false);
      return;
    }

    // Rate limit: max 10 referrals per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", profile.id)
      .gte("created_at", todayStart.toISOString());

    if (todayCount && todayCount >= 10) {
      toast.error("You've reached the daily referral limit (10). Try again tomorrow.");
      setSubmitting(false);
      return;
    }

    // Insert referral
    const { error } = await supabase.from("referrals").insert({
      company_id: profile.company_id!,
      referrer_id: profile.id,
      referee_name: form.fullName,
      referee_email: form.email,
      referee_phone: form.phone,
      service_type: form.relationship,
      service_id: form.serviceId || null,
      status: "pending",
      notes: `Address: ${form.streetAddress}, ${form.city}, ${form.state} ${form.zipCode}\nRelationship: ${form.relationship}\n${form.notes}`.trim(),
    });

    if (error) {
      toast.error("Failed to submit referral. Please try again.");
      setSubmitting(false);
      return;
    }

    // Fire confetti (dynamic import to reduce bundle)
    import("canvas-confetti").then(mod => {
      mod.default({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#3b82f6"],
      });
    });

    toast.success("Referral Submitted! We'll keep you updated on their progress.");

    setTimeout(() => {
      router.push("/dashboard/referrals");
    }, 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit a Referral</h1>
        <p className="text-muted-foreground">Refer someone and earn rewards when they complete a service.</p>
      </div>

      <StepIndicator current={step} />

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Contact Information"}
            {step === 2 && "Location"}
            {step === 3 && "Relationship & Review"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1 */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="John Doe" />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", formatPhone(e.target.value))} placeholder="(555) 123-4567" />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address *</Label>
                <Input id="streetAddress" value={form.streetAddress} onChange={(e) => update("streetAddress", e.target.value)} placeholder="123 Main St" />
                {errors.streetAddress && <p className="text-sm text-destructive">{errors.streetAddress}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Springfield" />
                  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select value={form.state} onValueChange={(v) => update("state", v)}>
                    <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Input id="zipCode" value={form.zipCode} onChange={(e) => update("zipCode", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="62704" />
                  {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode}</p>}
                </div>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              {services.length > 0 && (
                <div className="space-y-2">
                  <Label>Service Needed *</Label>
                  <Select value={form.serviceId} onValueChange={(v) => update("serviceId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} — {s.points_value.toLocaleString()} pts
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceId && <p className="text-sm text-destructive">{errors.serviceId}</p>}
                </div>
              )}
              <div className="space-y-2">
                <Label>How do you know this person? *</Label>
                <Select value={form.relationship} onValueChange={(v) => update("relationship", v)}>
                  <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.relationship && <p className="text-sm text-destructive">{errors.relationship}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value.slice(0, 500))} placeholder="Any details that might help..." rows={3} />
                <p className="text-xs text-muted-foreground text-right">{form.notes.length}/500</p>
              </div>

              {/* Review summary */}
              <div className="mt-4 rounded-lg border bg-muted/50 p-4">
                <h4 className="font-semibold mb-3">Review Your Referral</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{form.phone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium">{form.streetAddress}, {form.city}, {form.state} {form.zipCode}</span></div>
                  {form.serviceId && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{services.find(s => s.id === form.serviceId)?.name ?? "—"}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Relationship</span><span className="font-medium">{form.relationship}</span></div>
                  {form.notes && <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span className="font-medium">{form.notes}</span></div>}
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={nextStep}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Referral"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
