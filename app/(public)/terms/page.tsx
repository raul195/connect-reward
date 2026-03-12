import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Connect Reward terms of service — the rules and guidelines for using our platform.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1A202C]">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Last updated: March 12, 2026
          </p>

          <div className="prose prose-slate mt-10 max-w-none text-[#475569] [&_h2]:text-[#1A202C] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-[#1A202C] [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc [&_li]:mb-1">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Connect Reward (&quot;the Platform&quot;), operated by Connect
              Reward (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Platform.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Connect Reward is a white-label referral and loyalty platform that enables
              businesses to manage customer referral programs. The Platform provides tools
              for tracking referrals, managing points and tiers, and fulfilling rewards.
            </p>

            <h2>3. Account Registration</h2>
            <ul>
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 18 years old to use the Platform</li>
              <li>One person may not maintain more than one account</li>
              <li>You are responsible for all activity that occurs under your account</li>
            </ul>

            <h2>4. Business Accounts</h2>
            <p>If you register a business account, you additionally agree that:</p>
            <ul>
              <li>You have the authority to bind the business to these terms</li>
              <li>You are responsible for your customers&apos; experience on the Platform</li>
              <li>You will honor the rewards offered through your referral program</li>
              <li>You will not use the Platform for fraudulent or deceptive purposes</li>
              <li>Customer data collected through your program is subject to our Privacy Policy and applicable data protection laws</li>
            </ul>

            <h2>5. Customer Accounts</h2>
            <p>If you participate as a customer in a business&apos;s referral program:</p>
            <ul>
              <li>Referrals must be genuine — submitting fake or fraudulent referrals is prohibited</li>
              <li>Points have no cash value unless explicitly stated by the business</li>
              <li>Rewards are subject to availability and the business&apos;s terms</li>
              <li>We reserve the right to void points earned through fraudulent activity</li>
            </ul>

            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Submit false, misleading, or fraudulent referrals</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Use automated tools (bots, scrapers) to access the Platform</li>
              <li>Interfere with or disrupt the Platform&apos;s infrastructure</li>
              <li>Transmit malware, spam, or other harmful content</li>
              <li>Impersonate another person or entity</li>
            </ul>

            <h2>7. Subscription and Billing</h2>
            <ul>
              <li>Paid plans are billed monthly or annually as selected at signup</li>
              <li>Payments are processed securely through Stripe</li>
              <li>You may cancel your subscription at any time; access continues until the end of the billing period</li>
              <li>Refunds are handled on a case-by-case basis</li>
              <li>We reserve the right to change pricing with 30 days&apos; notice</li>
            </ul>

            <h2>8. Intellectual Property</h2>
            <p>
              The Platform, including its design, features, and content, is owned by Connect
              Reward and protected by intellectual property laws. You retain ownership of the
              data you upload. By using the Platform, you grant us a license to use your data
              solely to provide and improve our services.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Connect Reward shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages, including
              loss of profits, data, or business opportunities, arising from your use of the
              Platform.
            </p>
            <p>
              Our total liability for any claim arising from these terms shall not exceed the
              amount you paid us in the 12 months preceding the claim.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
              any kind, either express or implied. We do not guarantee that the Platform will
              be uninterrupted, error-free, or secure.
            </p>

            <h2>11. Termination</h2>
            <p>
              We may suspend or terminate your access to the Platform at any time for
              violation of these terms or for any other reason with reasonable notice. Upon
              termination, your right to use the Platform ceases immediately. You may
              request an export of your data before account deletion.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We may modify these Terms of Service at any time. Material changes will be
              communicated via email or a notice on the Platform at least 30 days before
              taking effect. Continued use after changes constitutes acceptance.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of the
              United States. Any disputes shall be resolved through binding arbitration
              or in the courts of competent jurisdiction.
            </p>

            <h2>14. Contact Us</h2>
            <p>
              If you have questions about these Terms of Service, contact us at:<br />
              Email: support@connectreward.io
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
