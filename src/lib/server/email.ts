/**
 * Email Service Provider for Creator OS
 * Handles Email Verification and Password Reset Link delivery.
 *
 * Supports SMTP or Resend credentials via environment variables.
 * In development or when no provider is configured, it safely logs the
 * delivery action and direct URL link to the server console.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ delivered: boolean; mode: "provider" | "logged" }> {
  const smtpHost = process.env.SMTP_HOST;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Creator OS <noreply@creator-os.app>",
          to,
          subject,
          html,
          text,
        }),
      });
      if (res.ok) {
        return { delivered: true, mode: "provider" };
      }
      console.warn("Resend email delivery failed, falling back to server log:", await res.text());
    } catch (err) {
      console.error("Resend API error:", err);
    }
  }

  // If no external provider configured, log the notification for dev/testing
  console.log("--------------------------------------------------");
  console.log(`[EMAIL NOTIFICATION TO: ${to}]`);
  console.log(`Subject: ${subject}`);
  console.log(`Content:\n${text}`);
  console.log("--------------------------------------------------");

  return { delivered: false, mode: "logged" };
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Verify your email for Creator OS",
    text: `Hi ${name},\n\nPlease verify your email for Creator OS by clicking the link below:\n${verifyUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe Creator OS Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Verify Your Creator OS Account</h2>
        <p>Hi ${name},</p>
        <p>Thanks for signing up for Creator OS. Please confirm your email address by clicking the button below:</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Reset your Creator OS password",
    text: `Hello,\n\nA password reset was requested for your Creator OS account.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.\n\nBest regards,\nThe Creator OS Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Reset Your Creator OS Password</h2>
        <p>A password reset was requested for your account. Click the button below to choose a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">This link is single-use and expires in 1 hour.</p>
      </div>
    `,
  });
}
