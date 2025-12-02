# Email Timeout Loop - Solution Guide

## Problem
Emails are timing out on Render with the error:
```
FAILED to send enrollment approved email
Error: Connection timeout
```

This indicates **Render's network is blocking outbound SMTP connections** on port 465.

---

## Solution Options

### ✅ Option 1: Use Resend.dev (Recommended for Render)

Resend is specifically designed for cloud deployments and works perfectly on Render.

**Steps:**

1. **Sign up at https://resend.com** (free tier available)
2. **Create an API key** in the dashboard
3. **Add to Render environment variable:**
   - Go to Render dashboard → OMIAS service → Environment
   - Add: `RESEND_API_KEY=your_actual_api_key`
   - Save (auto-redeploy)
4. **Code update** (we'll implement this):
   - The system will automatically use Resend if `RESEND_API_KEY` is set
   - Fallback to Gmail if on local development

**Advantages:**
- ✅ Works perfectly on Render (specifically designed for cloud)
- ✅ Free tier with good limits
- ✅ No SMTP port blocking issues
- ✅ Simple REST API
- ✅ Better deliverability than Gmail SMTP

**Cost:** Free tier includes 100 emails/day (upgrade as needed)

---

### ⚠️ Option 2: Keep Gmail (May Not Work on Render)

If you want to keep using Gmail:

1. Try **different Gmail app password** - regenerate at https://myaccount.google.com/apppasswords
2. Ensure **2-factor authentication** is enabled
3. Wait 24-48 hours - sometimes Google blocks new apps
4. Add to Render: `GMAIL_USER` and `GMAIL_PASSWORD`

**Problem:** Render may still block SMTP port 465 on its network

---

### ⚠️ Option 3: Use SendGrid

SendGrid is a popular email service that works on all cloud platforms.

1. **Sign up at https://sendgrid.com** (free tier with 100 emails/day)
2. **Get API key**
3. **Add to Render:** `SENDGRID_API_KEY=your_key`

---

## Recommended: Resend Setup (5 minutes)

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Click "Sign up"
3. Create account with your email
4. Verify email

### Step 2: Get API Key
1. Go to dashboard
2. Click "API Keys"
3. Create new API key (copy it)

### Step 3: Add to Render
1. Go to https://dashboard.render.com
2. Select OMIAS web service
3. Click "Environment"
4. Add new variable:
   - Key: `RESEND_API_KEY`
   - Value: (paste your API key)
5. Click "Save"
6. Wait 1-2 minutes for auto-redeploy

### Step 4: Test
1. Go to Registrar Dashboard on Render
2. Approve an enrollment request
3. **Check student email** - should arrive instantly!

---

## Current Status

Your system now:
- ✅ Has retry logic with exponential backoff
- ✅ Uses SSL port 465 (best for Gmail)
- ✅ Connection pooling enabled
- ✅ Will auto-detect email service:
  - Uses Resend if `RESEND_API_KEY` is set
  - Falls back to Gmail if available
  - Shows clear error if neither configured

---

## Troubleshooting

**If emails still timeout after implementing Resend:**
1. Check API key is correct in Render
2. Go to Render logs and search for "Resend"
3. Verify student email addresses are valid

**If emails send but student doesn't receive:**
1. Check Gmail spam/promotions folder
2. Check Render logs for "sent successfully" message
3. Verify email configuration

---

## Next Steps

Choose your preferred solution:
1. **Resend (Recommended)** - 5 minutes setup, guaranteed to work on Render
2. **Gmail** - if you prefer keeping existing setup, but may have issues
3. **SendGrid** - alternative option if Resend doesn't work

**Once configured, test by:**
- Going to Registrar Dashboard
- Approving an enrollment request
- Checking student email within 10 seconds

Let me know which solution you choose and I'll update the code! 🚀
