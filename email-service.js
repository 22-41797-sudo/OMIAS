const nodemailer = require('nodemailer');
require('dotenv').config();

let gmailTransporter;
let resendClient;

// Determine which email service to use
const USE_GMAIL = process.env.GMAIL_USER && process.env.GMAIL_PASSWORD;
const USE_RESEND = process.env.RESEND_API_KEY;

// Initialize Gmail transporter if credentials are available
if (USE_GMAIL) {
    try {
        gmailTransporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            },
            connectionTimeout: 30000,
            socketTimeout: 30000
        });
        console.log(' Gmail SMTP transporter initialized successfully');
    } catch (err) {
        console.error(' Error initializing Gmail transporter:', err.message);
        gmailTransporter = null;
    }
}

// Initialize Resend client if API key is available
if (USE_RESEND) {
    try {
        const Resend = require('resend').Resend;
        resendClient = new Resend(process.env.RESEND_API_KEY);
        console.log(' Resend client initialized successfully');
    } catch (err) {
        console.error(' Error initializing Resend client:', err.message);
        resendClient = null;
    }
}

/**
 * Retry logic with exponential backoff
 */
async function sendMailWithRetry(mailOptions, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            if (USE_GMAIL && gmailTransporter) {
                const result = await gmailTransporter.sendMail(mailOptions);
                console.log( Email sent via Gmail: ${mailOptions.to} (Attempt ${i + 1}));
                return result;
            } else if (USE_RESEND && resendClient) {
                const result = await resendClient.emails.send(mailOptions);
                console.log( Email sent via Resend: ${mailOptions.to} (Attempt ${i + 1}));
                return result;
            } else {
                throw new Error('No email service configured (requires GMAIL_USER/GMAIL_PASSWORD or RESEND_API_KEY)');
            }
        } catch (err) {
            lastError = err;
            console.error( Email send attempt ${i + 1} failed:, err.message);
            
            if (i < maxRetries - 1) {
                const delayMs = Math.pow(2, i) * 1000;
                console.log(  Retrying in ${delayMs}ms...);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    
    throw lastError || new Error('Failed to send email after all retries');
}

/**
 * Send enrollment confirmation email with token
 */
async function sendEnrollmentConfirmation(studentEmail, studentName, requestToken, registrationDate) {
    try {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const statusPageUrl = \/check-status?token=\;
        
        const submissionDateTime = new Date(registrationDate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        const htmlContent = <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .email-body {
            padding: 40px 30px;
        }
        .token-box {
            background-color: white;
            border: 2px solid #e0e7ff;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
            word-break: break-all;
            color: #667eea;
            text-align: center;
        }
        .status-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
            font-weight: 600;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #666;
        }
        .center-text {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Enrollment Successful</h1>
        </div>
        <div class="email-body">
            <p>Hello <strong>\</strong>,</p>
            <p>Thank you for completing your enrollment! Your form has been successfully submitted and is now being processed.</p>
            <p style="font-size: 16px; font-weight: 600; margin-top: 25px;">Your unique request token:</p>
            <div class="token-box">\</div>
            <div class="center-text">
                <a href="\" class="status-button">Check Enrollment Status</a>
            </div>
            <p>If you have any questions, please contact the ICT Coordinator office.</p>
        </div>
        <div class="email-footer">
            <p><strong>ICT Coordinator - Student Enrollment System</strong></p>
        </div>
    </div>
</body>
</html>;

        const mailOptions = {
            from: USE_GMAIL ? process.env.GMAIL_USER : 'noreply@resend.dev',
            to: studentEmail,
            subject: Enrollment Confirmation - Request Token: \,
            html: htmlContent
        };

        return await sendMailWithRetry(mailOptions);
    } catch (err) {
        console.error('Error sending enrollment confirmation email:', err.message);
        return false;
    }
}

/**
 * Send enrollment status update (approved/rejected)
 */
async function sendEnrollmentStatusUpdate(studentEmail, studentName, requestToken, status, rejectionReason = null) {
    try {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const statusPageUrl = \/check-status?token=\;
        
        let subject, htmlContent;
        
        if (status === 'approved') {
            subject = Enrollment Approved - \;
            htmlContent = 
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }
        .content { background: white; padding: 20px; margin-top: 20px; border-radius: 5px; }
        .status-badge { display: inline-block; background: #4caf50; color: white; padding: 10px 15px; border-radius: 3px; font-weight: bold; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Enrollment Status Update</h1>
        </div>
        <div class="content">
            <p>Hello <strong>\</strong>,</p>
            <p>Great news! Your enrollment application has been <span class="status-badge">APPROVED</span></p>
            <a href="\" class="btn">View Enrollment Status</a>
        </div>
    </div>
</body>
</html>;
        } else {
            subject = Enrollment Status Update;
            htmlContent = <p>Your enrollment status has been updated.</p>;
        }
        
        const mailOptions = {
            from: USE_GMAIL ? process.env.GMAIL_USER : 'noreply@resend.dev',
            to: studentEmail,
            subject: subject,
            html: htmlContent
        };
        
        return await sendMailWithRetry(mailOptions);
    } catch (err) {
        console.error('Error sending enrollment status email:', err.message);
        return false;
    }
}

/**
 * Send document request status update
 */
async function sendDocumentRequestStatusUpdate(studentEmail, studentName, requestToken, documentType, status, rejectionReason = null) {
    try {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const statusPageUrl = \/check-status?token=\;
        
        const mailOptions = {
            from: USE_GMAIL ? process.env.GMAIL_USER : 'noreply@resend.dev',
            to: studentEmail,
            subject: Document Request Update - \,
            html: <p>Your document request for <strong>\</strong> has been updated to: <strong>\</strong></p>
        };
        
        return await sendMailWithRetry(mailOptions);
    } catch (err) {
        console.error('Error sending document request email:', err.message);
        return false;
    }
}

/**
 * Test email configuration
 */
async function testEmailConfiguration(testEmail) {
    try {
        const htmlContent = 
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
    <h2>Email Configuration Test</h2>
    <p>This is a test email to verify that your email service is configured correctly.</p>
    <p><strong>Configuration Status:</strong></p>
    <ul>
        <li>Gmail SMTP: \</li>
        <li>Resend API: \</li>
    </ul>
</body>
</html>;

        const mailOptions = {
            from: USE_GMAIL ? process.env.GMAIL_USER : 'noreply@resend.dev',
            to: testEmail,
            subject: 'Email Configuration Test',
            html: htmlContent
        };

        return await sendMailWithRetry(mailOptions);
    } catch (err) {
        console.error('Error sending test email:', err.message);
        return false;
    }
}

module.exports = {
    sendEnrollmentStatusUpdate,
    sendDocumentRequestStatusUpdate,
    sendEnrollmentConfirmation,
    testEmailConfiguration
};
