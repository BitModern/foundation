import nodemailer from 'nodemailer';

// SMTP configuration
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  throw new Error(`Missing required SMTP environment variables: ${missingVars.join(', ')}`);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT!),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const mailOptions = {
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
      // Add headers to improve deliverability
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'StepMonkey',
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${params.to} via SMTP`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📨 Accepted: ${info.accepted?.join(', ') || 'N/A'}`);
    console.log(`⚠️  If email not received, check spam/junk folder for emails from StepMonkey`);
    return true;
  } catch (error: any) {
    console.error('SMTP email error details:', {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      message: error?.message,
    });
    console.log(`⚠️  Email delivery failed for ${params.to}, verification code available in server logs`);
    return false;
  }
}

export function generateVerificationEmail(email: string, code: string, firstName: string | null = null): EmailParams {
  const name = firstName ? ` ${firstName}` : '';
  return {
    to: email,
    from: process.env.SMTP_FROM || process.env.SMTP_USER!, // Use configured sender address
    subject: 'Verify Your StepMonkey Account',
    text: `Hi${name},\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nStepMonkey Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to StepMonkey!</h2>
        <p>Hi${name},</p>
        <p>Thank you for registering. Please use the verification code below to complete your account setup:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p>Best regards,<br>StepMonkey Team</p>
      </div>
    `
  };
}

export function generatePasswordResetEmail(email: string, code: string, firstName: string | null = null): EmailParams {
  const name = firstName ? ` ${firstName}` : '';
  return {
    to: email,
    from: process.env.SMTP_FROM || process.env.SMTP_USER!, // Use configured sender address
    subject: 'Reset Your StepMonkey Password',
    text: `Hi${name},\n\nYour password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nStepMonkey Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hi${name},</p>
        <p>We received a request to reset your password. Please use the code below:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #ef4444; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>StepMonkey Team</p>
      </div>
    `
  };
}

export function generateOneTimePasswordEmail(email: string, code: string, firstName: string | null = null): EmailParams {
  const name = firstName ? ` ${firstName}` : '';
  return {
    to: email,
    from: process.env.SMTP_FROM || process.env.SMTP_USER!, // Use configured sender address
    subject: 'Your StepMonkey One-Time Password',
    text: `Hi${name},\n\nYour one-time password is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this login, please ignore this email.\n\nBest regards,\nStepMonkey Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">One-Time Password Login</h2>
        <p>Hi${name},</p>
        <p>Here is your one-time password to log into StepMonkey:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #ef4444; font-size: 14px;">If you didn't request this login, please ignore this email.</p>
        <p>Best regards,<br>StepMonkey Team</p>
      </div>
    `
  };
}

