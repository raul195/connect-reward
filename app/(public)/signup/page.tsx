import { redirect } from "next/navigation";

// Self-registration is disabled. All new users must go through the early access flow.
// Approved contractors receive an invite email with a magic link to set up their account.
export default function SignupPage() {
  redirect("/early-access");
}
