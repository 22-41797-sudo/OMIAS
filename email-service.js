const nodemailer = require("nodemailer");
require("dotenv").config();

let gmailTransporter;
const USE_GMAIL = process.env.GMAIL_USER && process.env.GMAIL_PASSWORD;

if (USE_GMAIL) {
    try {
        gmailTransporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            },
            connectionTimeout: 60000,
            socketTimeout: 60000,
            greetingTimeout: 60000,
            pool: {
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000,
                rateLimit: 5
            }
        });
        console.log("✓ Gmail SMTP transporter initialized");
    } catch (err) {
        console.error("✗ Gmail transporter error:", err.message);
        gmailTransporter = null;
    }
}

async function sendMailWithRetry(mailOptions, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            if (USE_GMAIL && gmailTransporter) {
                const result = await gmailTransporter.sendMail(mailOptions);
                console.log(`✓ Email sent via Gmail: ${mailOptions.to}`);
                return result;
            }
        } catch (err) {
            lastError = err;
            console.error(`✗ Email send attempt ${i + 1} failed: ${err.message}`);
            if (i < maxRetries - 1) {
                const delayMs = 2000 * Math.pow(2, i);
                console.log(`  Retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}

async function sendEnrollmentConfirmation(studentEmail, studentName, requestToken, registrationDate) {
    try {
        const appUrl = process.env.APP_URL || "http://localhost:3000";
        const statusPageUrl = `${appUrl}/check-status?token=${encodeURIComponent(requestToken)}`;
        const submissionDateTime = new Date(registrationDate).toLocaleString("en-US");
        const htmlContent = `<html><body style="font-family:Arial;"><div style="max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;"><h2 style="color:#667eea;">Enrollment Successful</h2><p>Hello ${studentName},</p><p>Your enrollment request token:</p><div style="background:#fff;border:2px solid #e0e7ff;padding:15px;font-family:Courier;font-size:18px;font-weight:600;text-align:center;color:#667eea;">${requestToken}</div><p><a href="${statusPageUrl}" style="background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;">Check Status</a></p></div></body></html>`;
        return await sendMailWithRetry({ 
            from: process.env.GMAIL_USER, 
            to: studentEmail, 
            subject: `Enrollment Confirmation - ${requestToken}`, 
            html: htmlContent 
        });
    } catch (err) {
        console.error("Error sending enrollment confirmation:", err.message);
        return false;
    }
}

async function sendEnrollmentStatusUpdate(studentEmail, studentName, requestToken, status) {
    try {
        return await sendMailWithRetry({ 
            from: process.env.GMAIL_USER, 
            to: studentEmail, 
            subject: `Enrollment Status - ${status}`, 
            html: `<p>Your enrollment status: ${status}</p>` 
        });
    } catch (err) {
        console.error("Error:", err.message);
        return false;
    }
}

async function sendDocumentRequestStatusUpdate(studentEmail, studentName, requestToken, documentType, status) {
    try {
        return await sendMailWithRetry({ 
            from: process.env.GMAIL_USER, 
            to: studentEmail, 
            subject: `Document - ${documentType}`, 
            html: `<p>Status: ${status}</p>` 
        });
    } catch (err) {
        console.error("Error:", err.message);
        return false;
    }
}

async function testEmailConfiguration(testEmail) {
    try {
        return await sendMailWithRetry({ 
            from: process.env.GMAIL_USER, 
            to: testEmail, 
            subject: "Test", 
            html: "<p>Test</p>" 
        });
    } catch (err) {
        return false;
    }
}

module.exports = { sendEnrollmentStatusUpdate, sendDocumentRequestStatusUpdate, sendEnrollmentConfirmation, testEmailConfiguration };
