"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, ExternalLink, Star, Upload } from "lucide-react";

const PLATFORMS = [
  { value: "google", label: "Google Review", url: "https://g.page/review/your-company" },
  { value: "bbb", label: "BBB Review", url: "https://www.bbb.org/reviews/your-company" },
  { value: "yelp", label: "Yelp Review", url: "https://www.yelp.com/writeareview/your-company" },
  { value: "other", label: "Other", url: "" },
];

const TEMPLATES = [
  "I recently had [Company] install solar panels on my home and couldn't be happier with the experience. The team was professional, thorough, and completed the job on schedule. Highly recommend!",
  "From the initial consultation to the final installation, [Company] exceeded my expectations. Great communication throughout the entire process and the results speak for themselves.",
  "If you're considering solar, I highly recommend [Company]. Professional, efficient, and great value. The crew was respectful of our property and cleaned up perfectly after.",
];

export default function ReviewsPage() {
  const { profile } = useProfile();
  const [platform, setPlatform] = useState("google");
  const [reviewUrl, setReviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function copyTemplate(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Template copied to clipboard!");
  }

  function openReviewLink() {
    const p = PLATFORMS.find((pl) => pl.value === platform);
    if (p?.url) window.open(p.url, "_blank");
  }

  async function handleSubmit() {
    if (!profile || !reviewUrl.trim()) {
      toast.error("Please paste the URL of your review.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("reviews").insert({
      company_id: profile.company_id!,
      profile_id: profile.id,
      rating: 5,
      comment: `Platform: ${platform}\nReview URL: ${reviewUrl}`,
    });

    if (error) {
      toast.error("Failed to submit review. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
    toast.success("Review submitted for verification! You'll earn 25 points once verified.");
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Star className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Thank You!</h2>
            <p className="mt-2 text-muted-foreground">
              Your review has been submitted for verification. You&apos;ll earn 25 points once our team verifies it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit a Review</h1>
        <p className="text-muted-foreground">Leave a review and earn 25 bonus points after verification.</p>
      </div>

      {/* Section 1: Choose Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Choose a Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={platform} onValueChange={setPlatform} className="space-y-3">
            {PLATFORMS.map((p) => (
              <div key={p.value} className="flex items-center gap-3 rounded-lg border p-3">
                <RadioGroupItem value={p.value} id={p.value} />
                <Label htmlFor={p.value} className="flex-1 cursor-pointer font-medium">
                  {p.label}
                </Label>
                {p.url && (
                  <span className="text-xs text-muted-foreground truncate max-w-48 hidden sm:inline">{p.url}</span>
                )}
              </div>
            ))}
          </RadioGroup>
          <Button className="mt-4 bg-teal-600 hover:bg-teal-700" onClick={openReviewLink}>
            <ExternalLink className="mr-2 h-4 w-4" /> Write Your Review
          </Button>
        </CardContent>
      </Card>

      {/* Section 2: Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Need Inspiration?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {TEMPLATES.map((t, i) => (
            <div key={i} className="flex gap-3 rounded-lg border p-3">
              <p className="flex-1 text-sm text-muted-foreground">&ldquo;{t}&rdquo;</p>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyTemplate(t)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 3: Verify */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Verify Your Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reviewUrl">Paste the URL of your review</Label>
            <Input
              id="reviewUrl"
              value={reviewUrl}
              onChange={(e) => setReviewUrl(e.target.value)}
              placeholder="https://g.page/review/..."
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Or upload a screenshot of your review as an alternative.
          </p>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-teal-400 hover:bg-teal-50">
            <Upload className="h-5 w-5" />
            <span>Upload screenshot (optional)</span>
            <input type="file" accept="image/*" className="hidden" />
          </label>

          <Button
            className="w-full bg-teal-600 hover:bg-teal-700"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit for Verification"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
