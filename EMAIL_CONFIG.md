# Email Configuration Guide

This application uses Nodemailer to send email notifications to users when they submit enrollment and document requests.

## Setup Instructions

### 1. Enable 2-Factor Authentication on Gmail Account

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** (left sidebar)
3. Enable **2-Step Verification** if not already enabled

### 2. Generate App Password

1. After enabling 2FA, go back to **Security** 
2. Scroll down and find **App passwords** (appears only if 2FA is enabled)
3. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or your device type)
4. Google will generate a 16-character app password
5. Copy this password (remove spaces if any)

### 3. Update Environment Variables

Update your `.env` file with the Gmail credentials:

```
# Email Configuration (Gmail)
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_16_char_app_password_here
GMAIL_FROM_NAME=ICT-Coor RBAC System
```

Replace:
- `your_email@gmail.com` with your Gmail address
- `your_16_char_app_password_here` with the app password from step 2

### 4. Test Email Configuration

Run the following to test if email is working:

```bash
node test-email.js
```

## Email Notifications

The system sends emails in the following scenarios:

### 1. Enrollment Request Submission
- **When:** User submits an enrollment form
- **To:** Student's email
- **Contains:** Confirmation message and request token

### 2. Enrollment Status Updates
- **When:** Registrar approves/rejects enrollment request
- **To:** Student's email
- **Contains:** Status update and any rejection reason

### 3. Document Request Submission
- **When:** User submits a document request
- **To:** Student's email
- **Contains:** Confirmation message and request token

### 4. Document Status Updates
- **When:** Guidance staff updates document request status
- **To:** Student's email
- **Contains:** Status update (pending, processing, ready, completed, rejected)

## Troubleshooting

### Issue: "Invalid login credentials"
- Make sure you're using an **App Password**, not your regular Gmail password
- App password should be 16 characters without spaces

### Issue: "Less secure apps" error
- Make sure 2-Factor Authentication is enabled
- App passwords only work with 2FA enabled

### Issue: Emails not sending
- Check that `.env` file has correct `GMAIL_USER` and `GMAIL_PASSWORD`
- Make sure email addresses in forms are valid
- Check server console for error messages

### Using Different Email Provider

If you want to use a different email provider (like Outlook, Yahoo, etc.), update the email-service.js file:

```javascript
const transporter = nodemailer.createTransport({
    service: 'outlook', // or 'yahoo', 'gmail', etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
```

## Security Notes

- Never commit `.env` file to version control
- Keep your app password secure
- If compromised, regenerate the app password in Google Account settings
- Use `.env.example` as template for team members

## Email Templates

Email templates are defined in `email-service.js` and include:
- Enrollment confirmation
- Document request confirmation  
- Status update emails

You can customize these templates by editing the HTML in the email-service.js file.
