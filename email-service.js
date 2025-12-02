require('dotenv').config();
const nodemailer = require('nodemailer');

// Create transporter for Gmail using port 587 with TLS (alternative to SSL port 465)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // TLS port (alternative, sometimes less blocked than 465)
    secure: false, // false for TLS (starttls)
    requireTLS: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    logger: false,
    debug: false,
});

/**
 * Helper: Retry email sending with exponential backoff
 * Attempts to send email with retries on timeout/network errors
 */
async function sendMailWithRetry(mailOptions, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`   📧 Send attempt ${attempt}/${maxRetries}...`);
            const result = await transporter.sendMail(mailOptions);
            console.log(`   ✅ Success on attempt ${attempt}`);
            return result;
        } catch (err) {
            const isLastAttempt = attempt === maxRetries;
            const isTimeout = err.message.includes('timeout') || err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT';
            const isNetworkError = err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'EHOSTUNREACH';
            
            if ((isTimeout || isNetworkError) && !isLastAttempt) {
                const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                console.log(`   ⏱️ Attempt ${attempt} failed (${err.message}), retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue; // Retry
            }
            
            // If all retries failed or it's a different error, throw
            throw err;
        }
    }
}

/**
 * Send enrollment status update email to student
 * Only sends on: 'approved' or 'rejected' status
 */
async function sendEnrollmentStatusUpdate(studentEmail, studentName, requestToken, status, rejectionReason = null) {
    try {
        console.log(`\n📧 === ENROLLMENT EMAIL SERVICE CALLED ===`);
        console.log(`📧 To: ${studentEmail}`);
        console.log(`📧 Student: ${studentName}`);
        console.log(`📧 Status: ${status}`);
        console.log(`📧 Token: ${requestToken}`);
        
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
            console.error('❌ EMAIL SERVICE NOT CONFIGURED');
            console.error('Missing environment variables: GMAIL_USER or GMAIL_PASSWORD');
            console.error('📧 Please add to Render environment variables:');
            console.error('   GMAIL_USER=your_email@gmail.com');
            console.error('   GMAIL_PASSWORD=your_16_char_app_password');
            console.error(`❌ NOT sending email to ${studentEmail} - configuration required`);
            return false;
        }

        console.log(`✅ Email credentials found: ${process.env.GMAIL_USER}`);

        // Only send for approved or rejected
        if (status !== 'approved' && status !== 'rejected') {
            console.log(`⏭️ Enrollment status '${status}' - no notification sent`);
            return true;
        }

        let subject, title, message, color;

        if (status === 'approved') {
            subject = '✅ Enrollment Approved - ICT-Coor RBAC';
            title = 'Enrollment Approved!';
            message = 'Congratulations! Your enrollment request has been approved. You are now registered as a student.';
            color = '#28a745';
        } else {
            subject = '❌ Enrollment Request Declined - ICT-Coor RBAC';
            title = 'Enrollment Request Declined';
            message = 'Unfortunately, your enrollment request could not be approved at this time.';
            color = '#dc3545';
        }

        const mailOptions = {
            from: `"${process.env.GMAIL_FROM_NAME}" <${process.env.GMAIL_USER}>`,
            to: studentEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #333; border-bottom: 3px solid ${color}; padding-bottom: 10px;">${title}</h2>
                    
                    <p>Dear <strong>${studentName}</strong>,</p>
                    
                    <p>${message}</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0;">
                        <p><strong>Request Details:</strong></p>
                        <p><strong>Request Token:</strong> <code>${requestToken}</code></p>
                        <p><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${status.toUpperCase()}</span></p>
                        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
                    </div>
                    
                    ${status === 'approved' ? `
                        <p><strong>Next Steps:</strong></p>
                        <ol>
                            <li>Check your email for further instructions</li>
                            <li>Report to the registrar's office for confirmation</li>
                            <li>Complete any remaining requirements</li>
                        </ol>
                    ` : `
                        <p>If you believe this decision was made in error, please contact the registrar's office for clarification.</p>
                    `}
                    
                    <p>If you have any questions, please contact the registrar's office.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `,
        };

        await sendMailWithRetry(mailOptions);
        console.log(`✅ Enrollment ${status} email sent successfully to ${studentEmail}`);
        console.log(`   Student: ${studentName} | Token: ${requestToken}`);
        return true;
    } catch (err) {
        console.error(`\n❌ FAILED to send enrollment ${status} email to ${studentEmail}:`);
        console.error(`   Error Type: ${err.code || err.name}`);
        console.error(`   Error Message: ${err.message}`);
        console.error(`   Student: ${studentName} | Token: ${requestToken}`);
        
        // Provide specific troubleshooting based on error type
        if (err.message.includes('timeout') || err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
            console.error(`\n   ⏱️ CONNECTION TIMEOUT - Gmail SMTP server not responding after retries`);
            console.error(`   Attempted 3 retries with exponential backoff`);
            console.error(`\n   Possible causes:`);
            console.error(`   1. Render network may be blocking outbound SMTP on port 465`);
            console.error(`   2. Gmail SMTP server temporarily unreachable`);
            console.error(`   3. Network firewall between Render and Gmail`);
        } else if (err.message.includes('Invalid login') || err.code === 'EAUTH') {
            console.error(`\n   🔐 AUTHENTICATION FAILED - Invalid Gmail credentials`);
            console.error(`   Possible causes:`);
            console.error(`   1. GMAIL_USER or GMAIL_PASSWORD is incorrect on Render`);
            console.error(`   2. Gmail account doesn't have 2-factor authentication enabled`);
            console.error(`   3. Not using App Password (must be 16 characters)`);
        } else {
            console.error(`\n   Unknown error. Check Render logs for more details.`);
        }
        return false;
    }
}

/**
 * Send document request status notification to student
 * Only sends on: 'processing' (accepted), 'ready', or 'rejected' (declined) status
 */
async function sendDocumentRequestStatusUpdate(studentEmail, studentName, requestToken, documentType, status, rejectionReason = null) {
    try {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
            console.error('❌ EMAIL SERVICE NOT CONFIGURED');
            console.error('Missing environment variables: GMAIL_USER or GMAIL_PASSWORD');
            console.error('📧 Please add to Render environment variables:');
            console.error('   GMAIL_USER=your_email@gmail.com');
            console.error('   GMAIL_PASSWORD=your_16_char_app_password');
            console.error(`❌ NOT sending email to ${studentEmail} - configuration required`);
            return false;
        }

        // Only send for processing, ready, or rejected
        if (status !== 'processing' && status !== 'ready' && status !== 'rejected') {
            console.log(`⏭️ Document request status '${status}' - no notification sent`);
            return true;
        }

        let subject, title, message, color;

        if (status === 'processing') {
            subject = '✅ Document Request Accepted - ICT-Coor RBAC';
            title = 'Document Request Accepted';
            message = 'Your document request has been accepted and is now being processed.';
            color = '#17a2b8';
        } else if (status === 'ready') {
            subject = '📦 Your Document is Ready for Pickup - ICT-Coor RBAC';
            title = 'Document Ready for Pickup';
            message = 'Your requested document is now ready for pickup at the guidance office.';
            color = '#28a745';
        } else {
            subject = '❌ Document Request Declined - ICT-Coor RBAC';
            title = 'Document Request Declined';
            message = 'Unfortunately, your document request could not be processed at this time.';
            color = '#dc3545';
        }

        const mailOptions = {
            from: `"${process.env.GMAIL_FROM_NAME}" <${process.env.GMAIL_USER}>`,
            to: studentEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #333; border-bottom: 3px solid ${color}; padding-bottom: 10px;">${title}</h2>
                    
                    <p>Dear <strong>${studentName}</strong>,</p>
                    
                    <p>${message}</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0;">
                        <p><strong>Request Details:</strong></p>
                        <p><strong>Document Type:</strong> ${documentType}</p>
                        <p><strong>Request Token:</strong> <code>${requestToken}</code></p>
                        <p><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${status.toUpperCase()}</span></p>
                        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
                    </div>
                    
                    ${status === 'ready' ? `
                        <p style="color: #d9534f;"><strong>Important:</strong> Please bring a valid ID when picking up your document.</p>
                        <p><strong>Pickup Location:</strong> Guidance Office<br/>
                        <strong>Office Hours:</strong> 8:00 AM - 4:00 PM, Monday - Friday</p>
                    ` : status === 'processing' ? `
                        <p>Your document is being prepared. You will receive another notification when it's ready for pickup.</p>
                    ` : `
                        <p>If you believe this decision was made in error, please contact the guidance office for clarification.</p>
                    `}
                    
                    <p>If you have any questions, please contact the guidance office.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `,
        };

        await sendMailWithRetry(mailOptions);
        console.log(`✅ Document request ${status} email sent successfully to ${studentEmail}`);
        console.log(`   Student: ${studentName} | Document: ${documentType} | Token: ${requestToken}`);
        return true;
    } catch (err) {
        console.error(`\n❌ FAILED to send document request ${status} email to ${studentEmail}:`);
        console.error(`   Error Type: ${err.code || err.name}`);
        console.error(`   Error Message: ${err.message}`);
        console.error(`   Student: ${studentName} | Document: ${documentType} | Token: ${requestToken}`);
        
        // Provide specific troubleshooting based on error type
        if (err.message.includes('timeout') || err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
            console.error(`\n   ⏱️ CONNECTION TIMEOUT - Gmail SMTP server not responding after retries`);
            console.error(`   Attempted 3 retries with exponential backoff`);
            console.error(`   Possible causes:`);
            console.error(`   1. Network connectivity issues on Render`);
            console.error(`   2. Gmail SMTP server temporarily unreachable`);
            console.error(`   3. Port 587 (TLS) blocked by network firewall`);
        } else if (err.message.includes('Invalid login') || err.code === 'EAUTH') {
            console.error(`\n   🔐 AUTHENTICATION FAILED - Invalid Gmail credentials`);
            console.error(`   Possible causes:`);
            console.error(`   1. GMAIL_USER or GMAIL_PASSWORD is incorrect on Render`);
            console.error(`   2. Gmail account doesn't have 2-factor authentication enabled`);
            console.error(`   3. Not using App Password (must be 16 characters)`);
        } else {
            console.error(`\n   Unknown error. Check Render logs for more details.`);
        }
        return false;
    }
}

/**
 * Test email configuration
 */
async function testEmailConfiguration() {
    try {
        await transporter.verify();
        console.log('✅ Email configuration is valid');
        return true;
    } catch (err) {
        console.error('❌ Email configuration error:', err.message);
        return false;
    }
}

module.exports = {
    sendEnrollmentStatusUpdate,
    sendDocumentRequestStatusUpdate,
    testEmailConfiguration,
};
