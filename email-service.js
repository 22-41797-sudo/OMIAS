require('dotenv').config();
const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send enrollment status update email to student
 * Only sends on: 'approved' or 'rejected' status
 */
async function sendEnrollmentStatusUpdate(studentEmail, studentName, requestToken, status, rejectionReason = null) {
    try {
        console.log(`\n📧 === ENROLLMENT EMAIL SERVICE CALLED ===`);
        console.log(`📧 Service: Resend API`);
        console.log(`📧 To: ${studentEmail}`);
        console.log(`📧 Student: ${studentName}`);
        console.log(`📧 Status: ${status}`);
        console.log(`📧 Token: ${requestToken}`);
        
        if (!process.env.RESEND_API_KEY) {
            console.error('❌ EMAIL SERVICE NOT CONFIGURED');
            console.error('Missing environment variable: RESEND_API_KEY');
            console.error('📧 Please add to Render environment variables:');
            console.error('   RESEND_API_KEY=your_api_key');
            console.error(`❌ NOT sending email to ${studentEmail} - configuration required`);
            return false;
        }

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

        const html = `
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
            `;

        // Send via Resend API
        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: studentEmail,
            subject: subject,
            html: html,
        });

        if (result.error) {
            throw new Error(`Resend API error: ${result.error.message}`);
        }

        console.log(`✅ Enrollment ${status} email sent successfully to ${studentEmail}`);
        console.log(`   Student: ${studentName} | Token: ${requestToken}`);
        console.log(`   Message ID: ${result.data.id}`);
        return true;
    } catch (err) {
        console.error(`\n❌ FAILED to send enrollment ${status} email to ${studentEmail}:`);
        console.error(`   Error Type: ${err.code || err.name}`);
        console.error(`   Error Message: ${err.message}`);
        console.error(`   Student: ${studentName} | Token: ${requestToken}`);
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

        const html = `
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
            `;

        // Send via Resend API
        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: studentEmail,
            subject: subject,
            html: html,
        });

        if (result.error) {
            throw new Error(`Resend API error: ${result.error.message}`);
        }

        console.log(`✅ Document request ${status} email sent successfully to ${studentEmail}`);
        console.log(`   Student: ${studentName} | Document: ${documentType} | Token: ${requestToken}`);
        console.log(`   Message ID: ${result.data.id}`);
        return true;
    } catch (err) {
        console.error(`\n❌ FAILED to send document request ${status} email to ${studentEmail}:`);
        console.error(`   Error Type: ${err.code || err.name}`);
        console.error(`   Error Message: ${err.message}`);
        console.error(`   Student: ${studentName} | Document: ${documentType} | Token: ${requestToken}`);
        
        // Provide specific troubleshooting based on error type
        if (err.message.includes('Resend API error')) {
            console.error(`\n   🔌 RESEND API ERROR`);
            console.error(`   Possible causes:`);
            console.error(`   1. RESEND_API_KEY is invalid or not configured on Render`);
            console.error(`   2. Resend API temporarily unavailable`);
        } else if (err.message.includes('Invalid login')) {
            console.error(`\n   🔐 INVALID RESEND CREDENTIALS`);
            console.error(`   Verify RESEND_API_KEY is set correctly on Render`);
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
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is not configured');
        }

        // Test Resend API by sending a test email
        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev',  // Resend's test email address
            subject: 'Test Email from OMIAS',
            html: '<p>✅ Email configuration test successful!</p>',
        });

        if (result.error) {
            throw new Error(`Resend API test failed: ${result.error.message}`);
        }

        console.log('✅ Resend API configuration is valid');
        console.log(`   Test email sent with ID: ${result.data.id}`);
        return true;
    } catch (err) {
        console.error('❌ Resend API configuration error:', err.message);
        return false;
    }
}

module.exports = {
    sendEnrollmentStatusUpdate,
    sendDocumentRequestStatusUpdate,
    testEmailConfiguration,
};
