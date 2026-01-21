import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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

    const emailService = process.env.EMAIL_SERVICE || 'sendgrid'; // Default to SendGrid (allows free domains)
    const fromEmail = process.env.FROM_EMAIL || 'noreply@hydroponics-monitor.com';
    const fromName = process.env.FROM_NAME || 'Hydroponics Monitor';

    let success = false;
    let errorMessage = '';

    switch (emailService) {
      case 'resend':
        ({ success, errorMessage } = await sendResendEmail(data.subject, data.message, toEmail, fromEmail as string, fromName as string));
        break;
      case 'sendgrid':
        ({ success, errorMessage } = await sendSendGridEmail(data.subject, data.message, toEmail, fromEmail as string, fromName as string));
        break;
      case 'mailgun':
        ({ success, errorMessage } = await sendMailgunEmail(data.subject, data.message, toEmail, fromEmail as string, fromName as string));
        break;
      default:
        return NextResponse.json({ error: 'Unsupported email service' }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: errorMessage || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ status: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

async function sendResendEmail(subject: string, message: string, toEmail: string, fromEmail: string, fromName: string): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [toEmail],
      subject: subject,
      text: message,
    });

    if (error) {
      return { success: false, errorMessage: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, errorMessage: 'Resend API error' };
  }
}

async function sendSendGridEmail(subject: string, message: string, toEmail: string, fromEmail: string, fromName: string): Promise<{ success: boolean; errorMessage?: string }> {
  try {
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
        from: { email: fromEmail, name: fromName },
        content: [{
          type: 'text/plain',
          value: message,
        }],
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, errorMessage: `SendGrid error: ${error}` };
    }
  } catch (error) {
    return { success: false, errorMessage: 'SendGrid API error' };
  }
}

async function sendMailgunEmail(subject: string, message: string, toEmail: string, fromEmail: string, fromName: string): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    const domain = process.env.MAILGUN_DOMAIN || '';
    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        from: `${fromName} <${fromEmail}>`,
        to: toEmail,
        subject: subject,
        text: message,
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, errorMessage: `Mailgun error: ${error}` };
    }
  } catch (error) {
    return { success: false, errorMessage: 'Mailgun API error' };
  }
}
