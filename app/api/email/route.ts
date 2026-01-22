import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

    const toEmail = data.to || process.env.TO_EMAIL;
    if (!toEmail) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const fromEmail = process.env.FROM_EMAIL || 'noreply@hydroponics-monitor.com';
    const fromName = process.env.FROM_NAME || 'Hydroponics Monitor';

    const { success, errorMessage } = await sendSMTPEmail(data.subject, data.message, toEmail as string, fromEmail as string, fromName as string);

    if (!success) {
      return NextResponse.json({ error: errorMessage || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ status: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

async function sendSMTPEmail(subject: string, message: string, toEmail: string, fromEmail: string, fromName: string): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      text: message,
    });

    return { success: true };
  } catch (error) {
    return { success: false, errorMessage: `SMTP error: ${error instanceof Error ? error.message : String(error)}` };
  }
}
