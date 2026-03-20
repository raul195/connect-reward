"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, AlertCircle } from "lucide-react";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<{
    email: string;
    fullName: string;
    companyName: string;
    companyLogo: string | null;
    primaryColor: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing activation token. Please use the link from your welcome email.");
      setLoading(false);
      return;
    }

    async function validateToken() {
      try {
        const res = await fetch(`/api/auth/activate?token=${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Invalid activation link.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCustomerInfo(data);
      } catch {
        setError("Failed to validate activation link.");
      }
      setLoading(false);
    }

    validateToken();
  }, [token]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setActivating(true);

    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to activate account.");
        setActivating(false);
        return;
      }

      const data = await res.json();

      // Sign in with the new password
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      });

      if (signInError) {
        setError("Account activated but sign-in failed. Please go to the login page.");
        setActivating(false);
        return;
      }

      setActivated(true);
      setActivating(false);

      // Navigate to dashboard after a brief moment
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !customerInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-bold">Activation Failed</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button className="mt-6" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">You&apos;re In!</h2>
            <p className="mt-2 text-muted-foreground">
              Welcome to {customerInfo?.companyName}&apos;s referral rewards program. Taking you to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {customerInfo?.companyLogo ? (
            <img src={customerInfo.companyLogo} alt={customerInfo.companyName} className="mx-auto h-12 mb-4" />
          ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg mb-4" style={{ backgroundColor: customerInfo?.primaryColor || "#0D9488" }}>
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          )}
          <CardTitle className="text-2xl font-bold">Join {customerInfo?.companyName}</CardTitle>
          <CardDescription>
            Create your password to start earning rewards for referrals.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleActivate}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={customerInfo?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password" type="password" placeholder="At least 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword" type="password" placeholder="Confirm your password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                required minLength={8}
              />
            </div>
          </CardContent>
          <div className="px-6 pb-6">
            <Button type="submit" className="w-full" disabled={activating}>
              {activating ? "Activating..." : "Activate My Account"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" /></div>}>
      <ActivateForm />
    </Suspense>
  );
}
