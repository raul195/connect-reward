import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Connect Reward privacy policy — how we collect, use, and protect your personal information.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | Connect Reward",
    description:
      "How Connect Reward collects, uses, and protects your personal information.",
    url: "/privacy",
  },
  twitter: {
    title: "Privacy Policy | Connect Reward",
    description:
      "How Connect Reward collects, uses, and protects your personal information.",
  },
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1A202C]">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Last updated: March 12, 2026
          </p>

          <div className="prose prose-slate mt-10 max-w-none text-[#475569] [&_h2]:text-[#1A202C] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-[#1A202C] [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc [&_li]:mb-1">
            <h2>1. Introduction</h2>
            <p>
              Connect Reward (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the connectreward.io
              platform. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our platform.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>Information You Provide</h3>
            <ul>
              <li>Account information: name, email address, phone number</li>
              <li>Business information: company name, industry, website</li>
              <li>Referral data: names, emails, and phone numbers of referred individuals</li>
              <li>Payment information: processed securely through Stripe (we do not store card details)</li>
              <li>Communications: support tickets, feedback, and survey responses</li>
            </ul>

            <h3>Information Collected Automatically</h3>
            <ul>
              <li>Usage data: pages visited, features used, actions taken</li>
              <li>Device information: browser type, operating system, device type</li>
              <li>Log data: IP addresses, access times, referring URLs</li>
              <li>Cookies and similar technologies (see Section 7)</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>Provide, maintain, and improve our platform</li>
              <li>Process referrals and manage reward points</li>
              <li>Send transactional emails (referral updates, points earned, reward fulfillment)</li>
              <li>Send engagement emails (program reminders, milestone celebrations) based on your preferences</li>
              <li>Provide customer support</li>
              <li>Analyze usage patterns to improve our services</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>4. How We Share Your Information</h2>
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul>
              <li><strong>Business partners:</strong> When you participate in a business&apos;s referral program, that business can see your referral activity and points within their program</li>
              <li><strong>Service providers:</strong> Supabase (database/auth), Vercel (hosting), Resend (email delivery), Stripe (payments)</li>
              <li><strong>Legal requirements:</strong> When required by law, legal process, or to protect our rights</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as
              needed to provide services. You may request deletion of your account and
              associated data at any time by contacting us.
            </p>

            <h2>6. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit
              (TLS), encryption at rest, row-level security policies, and secure authentication
              through Supabase Auth. No method of transmission over the Internet is 100% secure,
              and we cannot guarantee absolute security.
            </p>

            <h2>7. Cookies</h2>
            <p>We use cookies and similar technologies for:</p>
            <ul>
              <li><strong>Essential cookies:</strong> Authentication and session management</li>
              <li><strong>Analytics cookies:</strong> Google Analytics to understand usage patterns</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling essential
              cookies may prevent you from using certain features.
            </p>

            <h2>8. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p>
              To exercise these rights, contact us at support@connectreward.io.
            </p>

            <h2>9. California Residents (CCPA)</h2>
            <p>
              California residents have additional rights under the CCPA, including the right
              to know what personal information is collected, request deletion, and opt out
              of the sale of personal information. We do not sell personal information.
            </p>

            <h2>10. Children&apos;s Privacy</h2>
            <p>
              Our platform is not intended for individuals under the age of 18. We do not
              knowingly collect personal information from children.
            </p>

            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              material changes by posting the updated policy on this page with a revised
              &quot;Last updated&quot; date.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at:<br />
              Email: support@connectreward.io
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
