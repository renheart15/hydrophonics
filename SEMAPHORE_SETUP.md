# Semaphore SMS Setup Guide

This guide will help you set up SMS notifications for your hydroponics monitoring system using Semaphore.

## 📋 Prerequisites

- Vercel account (where your app is deployed)
- Philippine mobile number for receiving SMS
- Internet connection

## 🚀 Step 1: Create Semaphore Account

1. Go to [https://semaphore.co](https://semaphore.co)
2. Click **"Sign Up"** or **"Get Started"**
3. Choose your plan:
   - **FREE Plan**: 100 SMS/month (perfect for testing)
   - **Paid Plans**: More SMS credits as needed
4. Complete registration with your email
5. Verify your email address

## 🔑 Step 2: Get API Credentials

1. Log in to your Semaphore dashboard
2. Go to **"API"** section in the left sidebar
3. You'll see your **API Key** - copy this (it looks like: `abc123def456...`)
4. Note: Semaphore doesn't require a separate sender ID for basic usage

## ⚙️ Step 3: Configure Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your **hydrophonics** project
3. Click on **"Settings"** tab
4. Click **"Environment Variables"** in the left sidebar
5. Add the following variables one by one:

### Required Variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `SMS_API_KEY` | `your_semaphore_api_key_here` | Your API key from Semaphore |
| `SMS_RECIPIENT` | `+639123456789` | Your Philippine mobile number with country code |
| `NEXT_PUBLIC_APP_URL` | `https://hydrophonics-mu.vercel.app` | Your Vercel app URL |

### Optional Variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `SMS_SENDER_ID` | `HYDROPONICS` | Custom sender name (optional) |

### Step-by-Step Addition:

1. Click **"Add New"** button
2. **Name**: Enter `SMS_API_KEY`
3. **Value**: Paste your Semaphore API key
4. **Environment**: Select **"Production"** (and Preview if you want)
5. Click **"Save"**

6. Repeat for `SMS_RECIPIENT`:
   - **Name**: `SMS_RECIPIENT`
   - **Value**: `+639xxxxxxxxx` (your Philippine number)
   - **Environment**: Production
   - Click **"Save"**

7. Repeat for `NEXT_PUBLIC_APP_URL`:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://hydrophonics-mu.vercel.app`
   - **Environment**: Production
   - Click **"Save"**

### Example Configuration:
```
SMS_API_KEY = abc123def456ghi789jkl012
SMS_RECIPIENT = +639171234567
NEXT_PUBLIC_APP_URL = https://hydrophonics-mu.vercel.app
SMS_SENDER_ID = HYDROPONICS  (optional)
```

8. **Redeploy** your application:
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** on the latest deployment
   - Wait for deployment to complete (2-3 minutes)

## 📱 Step 4: Test SMS Notifications

### Method 1: Manual Test
You can test SMS sending by making a POST request to your API:

```bash
curl -X POST https://your-app.vercel.app/api/sms \
  -H "Content-Type: application/json" \
  -d '{"message": "Test SMS from Hydroponics System"}'
```

Replace `your-app.vercel.app` with your actual Vercel domain.

### Method 2: Trigger Real Alerts
Upload the ESP32 code and let the system run. SMS will be sent automatically when:
- pH drops below 5.0 or rises above 7.5
- Water level drops below 20%

## 📞 Step 5: Verify SMS Delivery

1. Check your mobile phone for SMS
2. Expected SMS format:
   ```
   ⚠️ ALERT: pH level too low! Current: 4.2 (below 5.0). Replace water and fertilizer.
   ```

## 🔧 Troubleshooting

### SMS Not Received
- **Check API Key**: Ensure the API key is correct and active
- **Phone Number Format**: Must be `+639xxxxxxxxx` (Philippine format)
- **Credits**: Check if you have remaining SMS credits in Semaphore
- **Environment Variables**: Verify all variables are set correctly in Vercel

### Vercel Deployment Issues
- **Redeploy**: Always redeploy after adding environment variables
- **Logs**: Check Vercel function logs for API errors
- **Cold Starts**: First SMS might be delayed due to serverless cold starts

### API Errors
- **403 Forbidden**: Check API key validity
- **429 Too Many Requests**: Semaphore rate limiting (wait and retry)
- **500 Internal Error**: Check Vercel function logs

## 💰 Semaphore Pricing

| Plan | SMS/Month | Cost | Best For |
|------|-----------|------|----------|
| FREE | 100 | ₱0 | Testing |
| BASIC | 2,000 | ₱500 | Small projects |
| STANDARD | 10,000 | ₱2,000 | Medium projects |
| PREMIUM | 50,000 | ₱8,000 | Large operations |

## 📞 Support

- **Semaphore Support**: [support@semaphore.co](mailto:support@semaphore.co)
- **Documentation**: [https://semaphore.co/docs](https://semaphore.co/docs)
- **API Reference**: Available in your Semaphore dashboard

## 🎯 Next Steps

Once SMS is configured:
1. Monitor your hydroponics system remotely
2. Receive alerts for maintenance needs
3. Scale up your SMS plan as needed
4. Consider backup SMS providers for redundancy

Your hydroponics monitoring system is now complete with SMS notifications! 🌱📱
