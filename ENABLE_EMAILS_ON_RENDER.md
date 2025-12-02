# ⚙️ CRITICAL: Fix Email Notifications on Render

## Problem
- Emails are NOT being sent when registrar approves/rejects enrollment requests
- Reason: GMAIL_USER and GMAIL_PASSWORD are not set in Render environment

## Solution (5 minutes)

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Find your service: `omias-1`
3. Click on it

### Step 2: Add Environment Variables
1. Click **Settings** (left sidebar)
2. Scroll down to **Environment Variables**
3. Add these 3 variables (one by one):

| Key | Value |
|-----|-------|
| `GMAIL_USER` | `mainagasanfranciscointegrateds@gmail.com` |
| `GMAIL_PASSWORD` | `ivvw nowa rhyk lzvc` |
| `GMAIL_FROM_NAME` | `Mainaga San-Francisco Integrated School` |

### Step 3: Save & Deploy
1. Click **Save Changes**
2. Render will auto-redeploy (takes ~1 minute)
3. Wait for deployment to complete (green checkmark)

## Testing

After deployment, test if emails work:

### Option A: Use the test endpoint
```
GET https://omias-1.onrender.com/test-email?email=your-email@gmail.com
```

### Option B: Approve an enrollment manually
1. Go to Registrar Dashboard: https://omias-1.onrender.com/registrarlogin
2. Approve a pending enrollment request
3. Student should receive approval email

## What Works Now

✅ **When registrar APPROVES enrollment**
- Student receives: "✅ Enrollment Approved" email with request token

✅ **When registrar REJECTS enrollment**
- Student receives: "❌ Enrollment Request Declined" email with rejection reason

✅ **When guidance updates document request**
- Student receives: Status update emails (accepted, ready, declined)

## Troubleshooting

**Emails still not working?**

1. Check Render Logs:
   - Dashboard → omias-1 → Logs
   - Look for: "⚠️ Email service not configured"

2. Verify credentials are correct:
   - GMAIL_USER matches the one in .env
   - GMAIL_PASSWORD is an app-specific password (not regular password)

3. Wait a few minutes after deployment
   - Changes take time to propagate

## Need Help?

The email service will log helpful messages to:
- Render Logs: https://dashboard.render.com → omias-1 → Logs
- Look for: ✅ "Email sent" or ❌ "Error sending email"
