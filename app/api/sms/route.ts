import { NextRequest, NextResponse } from 'next/server';

// SMS configuration - replace with your provider's details
const SMS_CONFIG = {
  provider: 'semaphore', // Options: semaphore, twilio, chikka, etc.
  apiKey: process.env.SMS_API_KEY || '4053442aa8469def5330e2789fe41a10',
  senderId: process.env.SMS_SENDER_ID || 'HYDROPONICS',
  recipient: process.env.SMS_RECIPIENT || '+639943428659', // Phone number to send alerts to
};

interface SMSData {
  message: string;
  recipient?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: SMSData = await request.json();

    if (!data.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const recipient = data.recipient || SMS_CONFIG.recipient;
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient phone number is required' }, { status: 400 });
    }

    const success = await sendSMS(data.message, recipient);

    if (success) {
      return NextResponse.json({ status: 'SMS sent successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

async function sendSMS(message: string, recipient: string): Promise<boolean> {
  try {
    switch (SMS_CONFIG.provider) {
      case 'semaphore':
        return await sendSemaphoreSMS(message, recipient);
      case 'twilio':
        return await sendTwilioSMS(message, recipient);
      case 'chikka':
        return await sendChikkaSMS(message, recipient);
      default:
        console.error('Unsupported SMS provider');
        return false;
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

async function sendSemaphoreSMS(message: string, recipient: string): Promise<boolean> {
  const response = await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      apikey: SMS_CONFIG.apiKey,
      number: recipient,
      message: message,
      sendername: SMS_CONFIG.senderId,
    }),
  });

  return response.ok;
}

async function sendTwilioSMS(message: string, recipient: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  const fromNumber = process.env.TWILIO_FROM_NUMBER || '';

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
    },
    body: new URLSearchParams({
      To: recipient,
      From: fromNumber,
      Body: message,
    }),
  });

  return response.ok;
}

async function sendChikkaSMS(message: string, recipient: string): Promise<boolean> {
  // Chikka API implementation - adjust based on their API
  const response = await fetch('https://post.chikka.com/smsapi/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      message_type: 'SEND',
      mobile_number: recipient,
      shortcode: SMS_CONFIG.apiKey,
      message_id: Date.now().toString(),
      message: message,
      client_id: process.env.CHICKA_CLIENT_ID || '',
      secret_key: process.env.CHICKA_SECRET_KEY || '',
    }),
  });

  return response.ok;
}
