/**
 * Send enrollment confirmation email with token details
 */
async function sendEnrollmentConfirmation(studentEmail, studentName, requestToken, registrationDate) {
    try {
        const statusPageUrl = `${process.env.APP_URL || 'http://localhost:3000'}/check-status`;
        const tokenPrefilledUrl = `${statusPageUrl}?token=${encodeURIComponent(requestToken)}`;
        const submissionDateTime = new Date(registrationDate).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });

        const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto;line-height:1.6;color:#333;background-color:#f5f5f5;margin:0;padding:20px}.email-container{max-width:600px;margin:0 auto;background-color:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden}.email-header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:40px 20px;text-align:center}.email-header h1{margin:0;font-size:28px;font-weight:600}.email-body{padding:40px 30px}.confirmation-box{background-color:#f0f9ff;border-left:4px solid #0ea5e9;padding:20px;margin:25px 0;border-radius:4px}.token-box{background-color:white;border:2px solid #e0e7ff;padding:15px;margin:15px 0;border-radius:4px;font-size:18px;font-weight:600;letter-spacing:2px;font-family:'Courier New',monospace;word-break:break-all;color:#667eea}.status-button{display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin-top:15px;font-weight:600}.important-note{background-color:#fef2f2;border-left:4px solid #ef4444;padding:15px;margin:25px 0;border-radius:4px;font-size:14px;color:#7f1d1d}.email-footer{background-color:#f8f9fa;padding:30px;text-align:center;border-top:1px solid #e5e7eb;font-size:13px;color:#666}</style></head><body><div class="email-container"><div class="email-header"><h1> Enrollment Successful</h1></div><div class="email-body"><p>Hello <strong>${studentName}</strong>,</p><p>Thank you for completing your enrollment! Your form has been successfully submitted and is now being processed.</p><div class="confirmation-box"><p><strong>Submission Details:</strong></p><p> Date & Time: <strong>${submissionDateTime}</strong></p></div><p>Your unique request token:</p><div class="token-box">${requestToken}</div><div style="text-align:center"><a href="${tokenPrefilledUrl}" class="status-button">Check Enrollment Status</a></div><div class="important-note"><strong> Keep This Email:</strong> If you forget your request token, you can refer back to this email.</div></div><div class="email-footer"><p><strong>ICT Coordinator - Student Enrollment System</strong></p></div></div></body></html>`;

        const mailOptions = { to: studentEmail, subject: `Enrollment Confirmation - Request Token: ${requestToken}`, html: htmlContent };
        
        if (USE_GMAIL) { mailOptions.from = process.env.GMAIL_USER; await gmailTransporter.sendMail(mailOptions); }
        else if (USE_RESEND) { mailOptions.from = `ICT Coordinator <onboarding@resend.dev>`; await resendClient.emails.send(mailOptions); }
        
        return true;
    } catch (err) { console.error(` Failed to send enrollment confirmation:`, err.message); return false; }
}

module.exports = {
    sendEnrollmentStatusUpdate,
    sendDocumentRequestStatusUpdate,
    sendEnrollmentConfirmation,
    testEmailConfiguration,
};
