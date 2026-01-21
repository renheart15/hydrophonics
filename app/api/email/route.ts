import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.FROM_NAME || 'Hydroponics Monitor';

    const { data: emailData, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [toEmail],
      subject: data.subject,
      text: data.message,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ status: 'Email sent successfully', id: emailData?.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
