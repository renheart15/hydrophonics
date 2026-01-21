import { NextRequest, NextResponse } from 'next/server';

// Email configuration
const EMAIL_CONFIG = {
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  fromEmail: process.env.FROM_EMAIL || '',
  fromName: process.env.FROM_NAME || 'Hydroponics Monitor',
  toEmail: process.env.TO_EMAIL || '',
};

interface EmailData {
  subject: string;
  message: string;
  to?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: EmailData = await request.json();

    if (!data.subject || !data.message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    const toEmail = data.to || EMAIL_CONFIG.toEmail;
    if (!toEmail) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const success = await sendEmail(data.subject, data.message, toEmail);

    if (success) {
      return NextResponse.json({ status: 'Email sent successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

async function sendEmail(subject: string, message: string, toEmail: string): Promise<boolean> {
  try {
    // For Vercel deployment, we'll use a service like SendGrid, Mailgun, or Resend
    // Since we can't use SMTP directly in serverless, we'll use fetch to a transactional email service

    const emailService = process.env.EMAIL_SERVICE || 'resend'; // Options: resend, sendgrid, mailgun

    switch (emailService) {
      case 'resend':
        return await sendResendEmail(subject, message, toEmail);
      case 'sendgrid':
        return await sendSendGridEmail(subject, message, toEmail);
      case 'mailgun':
        return await sendMailgunEmail(subject, message, toEmail);
      default:
        console.error('Unsupported email service');
        return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

async function sendResendEmail(subject: string, message: string, toEmail: string): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
      to: [toEmail],
      subject: subject,
      text: message,
    }),
  });

  return response.ok;
}

async function sendSendGridEmail(subject: string, message: string, toEmail: string): Promise<boolean> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: toEmail }],
        subject: subject,
      }],
      from: { email: EMAIL_CONFIG.fromEmail, name: EMAIL_CONFIG.fromName },
      content: [{
        type: 'text/plain',
        value: message,
      }],
    }),
  });

  return response.ok;
}

async function sendMailgunEmail(subject: string, message: string, toEmail: string): Promise<boolean> {
  const domain = process.env.MAILGUN_DOMAIN || '';
  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
      to: toEmail,
      subject: subject,
      text: message,
    }),
  });

  return response.ok;
}
