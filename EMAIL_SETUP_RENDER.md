# Configure Email Notifications on Render

The email notifications for enrollment approvals/rejections require Gmail credentials. Follow these steps:

## Step 1: Add Environment Variables to Render

Go to your Render Dashboard:
1. Click on your service: `omias-1`
2. Go to **Settings** → **Environment**
3. Add these 3 variables:

```
GMAIL_USER=mainagasanfranciscointegrateds@gmail.com
GMAIL_PASSWORD=ivvw nowa rhyk lzvc
GMAIL_FROM_NAME=Mainaga San-Francisco Integrated School
```

## Step 2: Save & Deploy

After adding the variables:
1. Click **Save Changes**
2. Render will automatically re-deploy your app

## Step 3: Test Email

Once deployed, you can test the email system by visiting:
```
https://omias-1.onrender.com/test-email?email=your-email@gmail.com
```

## What These Variables Do

- **GMAIL_USER**: The Gmail account that sends emails
- **GMAIL_PASSWORD**: App-specific password (not your regular Gmail password)
- **GMAIL_FROM_NAME**: Display name in the "From" field of emails

## Email Triggers

Emails are now sent automatically:
- ✅ When registrar **APPROVES** an enrollment request → Student gets approval email
- ✅ When registrar **REJECTS** an enrollment request → Student gets rejection email
- ✅ Document request status changes → Student gets notification

## Troubleshooting

If emails still don't work after deploying:
1. Check Render logs: Dashboard → omias-1 → Logs
2. Look for error messages related to email
3. Verify the Gmail credentials are correct
4. Make sure the password is an app-specific password, not your regular Gmail password
