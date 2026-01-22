# Email Notifications Setup Guide

This guide will help you set up email notifications for your hydroponics monitoring system using SMTP.

## 📋 Prerequisites

- Vercel account (where your app is deployed)
- Email account (Gmail, Outlook, etc.) with app password
- Internet connection

## 🚀 Step 2: Set Up SMTP Email Account

For Gmail:
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to **Security** > **App passwords**
4. Generate an app password for "Hydroponics Monitor"
5. Copy the 16-character password

For Outlook/Hotmail:
1. Go to account settings
2. Enable app passwords if available, or use your regular password

## ⚙️ Step 3: Configure Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your **hydrophonics** project
3. Click **"Settings"** tab
4. Click **"Environment Variables"**

Add these environment variables:

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_SECURE = false
SMTP_USER = your-email@gmail.com
SMTP_PASS = fdusizdkbckidzuy
FROM_EMAIL = your-email@gmail.com
FROM_NAME = Hydroponics Monitor
TO_EMAIL = recipient@example.com
NEXT_PUBLIC_APP_URL = https://hydrophonics-mu.vercel.app
```

## 📧 Step 4: Test SMTP Connection

Test your SMTP settings by sending a test email. Make sure:
- Your email account allows SMTP connections
- App password is correct (for Gmail)
- SMTP server settings match your provider

## 📱 Step 4: Configure ESP32 Email Settings

Update the ESP32 code with your Gmail credentials:

```cpp
// Gmail SMTP settings
const char* smtpServer = "smtp.gmail.com";
const int smtpPort = 587;
const char* smtpUser = "your-email@gmail.com"; // Replace with your Gmail
const char* smtpPass = "your-app-password"; // Replace with 16-char app password
const char* fromEmail = "your-email@gmail.com"; // Replace with your Gmail
const char* toEmail = "recipient@example.com"; // Replace with recipient email
```

## 📧 Step 5: Upload ESP32 Code

Upload the updated ESP32 code to your board. The ESP32 will now:

- Send sensor data to your web dashboard every 3 seconds
- Monitor pH and water levels for alerts
- Send HTTP requests to your Vercel server when alerts are triggered:
  - pH drops below 5.0 or rises above 7.5
  - Water level drops below 20% (200mm)
- Your Vercel server handles the actual Gmail SMTP sending
- Prevent email spam with 5-minute cooldown between alerts

## 📨 Step 6: Verify Email Delivery

1. Check your email inbox (and spam folder)
2. Expected email format:
   ```
   Subject: Hydroponics System Alert

   ⚠️ ALERT: pH level too low! Current: 4.2 (below 5.0). Replace water and fertilizer.
   ```

## 🔧 Troubleshooting

### Email Not Received
- **Check SMTP Credentials**: Ensure SMTP_USER and SMTP_PASS are correct
- **App Password**: For Gmail, use app password, not regular password
- **SMTP Settings**: Verify SMTP_HOST, SMTP_PORT, and SMTP_SECURE are correct
- **Firewall**: Some networks block SMTP ports

### Vercel Issues
- **Redeploy**: Always redeploy after adding environment variables
- **Logs**: Check Vercel function logs for SMTP connection errors
- **Rate Limits**: Email providers may rate limit SMTP connections

### SMTP Connection Errors
- **Authentication Failed**: Check username/password
- **Connection Timeout**: Verify SMTP server and port
- **TLS/SSL Issues**: Check SMTP_SECURE setting

## 📊 SMTP Provider Information

### Gmail SMTP
- **Server**: smtp.gmail.com
- **Port**: 587 (TLS) or 465 (SSL)
- **Security**: Required (2FA + App Password)
- **Limits**: 500 emails/day

### Outlook/Hotmail SMTP
- **Server**: smtp-mail.outlook.com
- **Port**: 587
- **Security**: STARTTLS required
- **Limits**: Varies by account type

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
