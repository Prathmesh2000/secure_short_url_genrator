import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

if (!process.env.EMAIL_FROM) {
  throw new Error('EMAIL_FROM is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

type OtpPurpose = 'signup' | 'reset_password';

function getSubject(purpose: OtpPurpose): string {
  switch (purpose) {
    case 'signup':
      return 'Verify your email address';
    case 'reset_password':
      return 'Reset your password';
    default:
      return 'Your verification code';
  }
}

function getBody(otp: string, purpose: OtpPurpose): string {
  const action =
    purpose === 'signup'
      ? 'complete your signup'
      : 'reset your password';

  return `
Your verification code is:

${otp}

This code will expire in 10 minutes.

If you did not request this, you can safely ignore this email.

— Short URL Team
`.trim();
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: OtpPurpose
): Promise<void> {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: getSubject(purpose),
    text: getBody(otp, purpose)
  });
}
