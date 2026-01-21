# Email Notifications Setup Guide

This guide will help you set up email notifications for your hydroponics monitoring system using SMTP-compatible email services.

## 📋 Prerequisites

- Vercel account (where your app is deployed)
- Email account (Gmail, Outlook, etc.)
- Internet connection

## 🚀 Step 1: Choose an Email Service

For Vercel deployment, we recommend transactional email services rather than direct SMTP:

### **Recommended Services:**
1. **Resend** (Easiest setup, great free tier)
2. **SendGrid** (Popular, reliable)
3. **Mailgun** (Good for bulk emails)

## 🔑 Step 2: Set Up Email Service Account

### **⚠️ Important: Domain Requirements**
Most email services require domain verification. You **cannot use free domains** like Gmail (@gmail.com), Outlook (@outlook.com), or Yahoo for sending emails. You need either:
- A custom domain (e.g., yoursite.com) - requires domain purchase
- Services that allow free domains for sending

### **Option A: SendGrid (Allows Free Domains)** ⭐ **Recommended**

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up and verify your account
3. Go to **Settings** > **API Keys**
4. Create a new API key with **Full Access** permissions
5. Copy the API key
6. **No domain verification needed** - SendGrid allows sending from Gmail/Outlook addresses

### **Option B: Mailgun (Requires Domain)**

1. Go to [mailgun.com](https://mailgun.com)
2. Sign up and verify your domain (purchase a domain first)
3. Go to **Sending** > **Domains** to verify your domain
4. Go to **API** > **API Keys**
5. Copy the private API key

### **Option C: Resend (Requires Domain)**

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. **Purchase and verify a domain** (required - cannot use free domains)
4. Go to **API Keys** section
5. Create a new API key
6. Copy the API key

## ⚙️ Step 3: Configure Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your **hydrophonics** project
3. Click **"Settings"** tab
4. Click **"Environment Variables"**

### **For Resend:**
```
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL = your-verified-email@yourdomain.com
FROM_NAME = Hydroponics Monitor
TO_EMAIL = your-email@example.com
EMAIL_SERVICE = resend
NEXT_PUBLIC_APP_URL = https://hydrophonics-mu.vercel.app
```

### **For SendGrid:**
```
SENDGRID_API_KEY = SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL = your-verified-email@yourdomain.com
FROM_NAME = Hydroponics Monitor
TO_EMAIL = your-email@example.com
EMAIL_SERVICE = sendgrid
NEXT_PUBLIC_APP_URL = https://hydrophonics-mu.vercel.app
```

### **For Mailgun:**
```
MAILGUN_API_KEY = key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN = yourdomain.com
FROM_EMAIL = alerts@yourdomain.com
FROM_NAME = Hydroponics Monitor
TO_EMAIL = your-email@example.com
EMAIL_SERVICE = mailgun
NEXT_PUBLIC_APP_URL = https://hydrophonics-mu.vercel.app
```

## 📧 Step 4: Verify Domain (If Required)

### **Resend:**
- Add and verify your domain in the Resend dashboard
- Or use their shared domain initially

### **SendGrid:**
- Single sender verification required
- Go to **Settings** > **Sender Authentication**
- Verify your email address

### **Mailgun:**
- Domain verification required
- Add DNS records as instructed

## 📱 Step 5: Test Email Notifications

### Method 1: Manual Test
```bash
curl -X POST https://hydrophonics-mu.vercel.app/api/email \
  -H "Content-Type: application/json" \
  -d '{"subject": "Test Alert", "message": "This is a test email from your hydroponics system"}'
```

### Method 2: Trigger Real Alerts
Upload the ESP32 code and let the system run. Emails will be sent automatically when:
- pH drops below 5.0 or rises above 7.5
- Water level drops below 20%

## 📨 Step 6: Verify Email Delivery

1. Check your email inbox (and spam folder)
2. Expected email format:
   ```
   Subject: Hydroponics System Alert

   ⚠️ ALERT: pH level too low! Current: 4.2 (below 5.0). Replace water and fertilizer.
   ```

## 🔧 Troubleshooting

### Email Not Received
- **Check API Key**: Ensure the API key is correct and active
- **Verify Sender**: Make sure FROM_EMAIL is verified in your email service
- **Check Quotas**: Some services have sending limits for free accounts
- **Domain Verification**: Ensure domain is properly verified

### Vercel Issues
- **Redeploy**: Always redeploy after adding environment variables
- **Logs**: Check Vercel function logs for API errors
- **Rate Limits**: Email services may have rate limits

### API Errors
- **401 Unauthorized**: Check API key validity
- **403 Forbidden**: Verify domain/sender authentication
- **429 Too Many Requests**: Service rate limiting

## 📊 Pricing Comparison

| Service | Free Tier | Cost | Best For |
|---------|-----------|------|----------|
| **Resend** | 3,000 emails/month | $0-20/month | Beginners |
| **SendGrid** | 100 emails/day | $0-89/month | Small businesses |
| **Mailgun** | 5,000 emails/month | $0-35/month | Developers |

## 🎯 Next Steps

Once email is configured:
1. Receive alerts via both SMS and email
2. Set up email filters for hydroponics alerts
3. Consider integrating with monitoring dashboards
4. Backup notification system ensures you never miss critical alerts

## 🔄 Dual Notification System

Your system now sends both SMS and email alerts simultaneously:
- **SMS**: Immediate mobile notifications
- **Email**: Detailed logs and backup notifications

This ensures you receive critical hydroponics system alerts through multiple channels! 🌱📧📱
