import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  try {
    const { email, full_name } = await request.json();

    if (!email || !full_name) {
      return NextResponse.json({ error: "Missing email or name." }, { status: 400 });
    }

    const signupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/signup?role=contractor&invite=approved&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "You're in! Your Connect Reward account is ready",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A202C;">
          <h2 style="color: #0D9488;">Hi ${full_name},</h2>
          <p>Great news — your application for Connect Reward has been approved!</p>
          <p>You can now create your account and start setting up your referral rewards program:</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(to right, #0D9488, #0F766E); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">
              Create Your Account
            </a>
          </p>
          <p>Here's what you can do right away:</p>
          <ul>
            <li>Set up your rewards catalog</li>
            <li>Invite your first customers</li>
            <li>Start tracking referrals</li>
          </ul>
          <p>If you need any help getting started, reply to this email.</p>
          <p style="margin-top: 32px; color: #64748B;">Welcome aboard!<br/>— The Connect Reward Team</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Approve email error:", err);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }
}
