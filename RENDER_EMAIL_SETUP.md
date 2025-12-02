# Email Configuration on Render (Nodemailer Setup)

This guide explains how to enable email notifications on Render for enrollment and document request approvals.

## Current Status

- **Local (.env file):** ✅ Email is configured
- **Render Deployment:** ❌ Email is NOT configured (missing environment variables)

When students submit enrollments or registrar approves requests, **no emails are being sent** because Render doesn't have the Gmail credentials.

---

## Step-by-Step Setup for Render

### Step 1: Generate Gmail App Password

**Requirements:**
- Gmail account with 2-factor authentication enabled
- Access to https://myaccount.google.com/

**Instructions:**

1. Go to https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Scroll to find **App passwords** (only visible if 2FA is enabled)
   - If 2FA is NOT enabled, enable it first
4. Select:
   - **App:** Mail
   - **Device:** Windows Computer (or your device)
5. Google will generate a **16-character app password**
6. **Copy this password** (it includes spaces - keep them)

**Example:** `ivvw nowa rhyk lzvc`

---

### Step 2: Add Environment Variables to Render

1. Go to https://dashboard.render.com
2. Select your OMIAS web service
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add these two variables:

| Key | Value |
|-----|-------|
| `GMAIL_USER` | your_email@gmail.com |
| `GMAIL_PASSWORD` | your_16_char_app_password |

**Example:**
```
GMAIL_USER = mainagasanfranciscointegrateds@gmail.com
GMAIL_PASSWORD = ivvw nowa rhyk lzvc
```

6. Click **Save**
7. Render will **automatically redeploy** your application

---

### Step 3: Verify Email is Working

After Render redeploys (wait 1-2 minutes):

1. Go to your Registrar Dashboard on Render
2. Submit a new enrollment request
3. Go to "Registrar Dashboard" → Approve the request
4. **Check the student's Gmail inbox** for the approval notification

**Expected Email:**
- **Subject:** ✅ Enrollment Approved - ICT-Coor RBAC
- **From:** Mainaga San-Francisco Integrated School
- **Contains:** Student name, status, and request token

---

## Troubleshooting

### Problem: "No email received after approval"

**Check the Render logs:**

1. Go to https://dashboard.render.com
2. Select your web service
3. Click **Logs** at the top
4. Look for one of these messages:

**If you see:**
```
❌ EMAIL SERVICE NOT CONFIGURED
Missing environment variables: GMAIL_USER or GMAIL_PASSWORD
```
→ Environment variables not added to Render yet. Go back to Step 2.

**If you see:**
```
❌ FAILED to send enrollment approved email to student@gmail.com:
Error: Invalid login credentials
```
→ The Gmail app password is incorrect. Regenerate a new one and update Render.

**If you see:**
```
✅ Enrollment approved email sent successfully to student@gmail.com
```
→ Email was sent! Check student's Gmail spam/promotions folder.

---

## Email Sending Scenarios

The system sends emails in these situations:

### 1. Enrollment Status Updates (Your Main Need)
- **Triggered:** When registrar clicks "Approve" or "Reject" on enrollment request
- **To:** Student's email address (from enrollment form)
- **Content:** 
  - Approval/rejection status
  - Request token
  - Next steps if approved
  - Rejection reason if rejected

### 2. Document Request Status Updates
- **Triggered:** When guidance staff updates document request status
- **To:** Student's email address
- **Status:** pending → processing → ready (or rejected)

---

## Using a Different Gmail Account

If you want to use a different Gmail account:

1. Generate a new app password for that Gmail account
2. Update `GMAIL_USER` and `GMAIL_PASSWORD` in Render environment variables
3. You may need to update the sender name in email-service.js:

```javascript
from: `"Mainaga San-Francisco Integrated School" <${process.env.GMAIL_USER}>`
```

---

## Important Notes

⚠️ **Security:**
- Keep your app password secure
- If leaked, regenerate it in Google Account settings
- Never commit `.env` with real passwords to Git

📧 **Gmail Requirements:**
- Account must have 2-factor authentication enabled
- Must use "App Password" (not your regular Gmail password)
- App password is 16 characters including spaces

🔄 **Auto-Deployment:**
- When you update environment variables on Render, it automatically redeploys
- Wait 1-2 minutes for changes to take effect
- Check the Deployment section in Render to see status

---

## Testing Email Locally

To test if email works before deploying to Render:

1. Make sure `.env` file has your Gmail credentials
2. Run the test script:
```bash
node test-email.js
```

3. Check the output for success or error messages

---

## Next Steps

1. ✅ Generate Gmail app password (Step 1 above)
2. ✅ Add to Render environment variables (Step 2 above)
3. ✅ Wait for Render to redeploy
4. ✅ Test by approving an enrollment request
5. ✅ Verify student received the approval email

Once this is done, all approval/rejection notifications will work automatically!
