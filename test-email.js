require('dotenv').config();
const emailService = require('./email-service');

async function testEmail() {
    console.log('📧 Testing Email Configuration...\n');
    
    // Test configuration
    console.log('🔧 Configuration Details:');
    console.log(`   GMAIL_USER: ${process.env.GMAIL_USER}`);
    console.log(`   GMAIL_PASSWORD: ${process.env.GMAIL_PASSWORD ? '***' + process.env.GMAIL_PASSWORD.slice(-3) : 'NOT SET'}`);
    console.log(`   GMAIL_FROM_NAME: ${process.env.GMAIL_FROM_NAME}\n`);
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
        console.error('❌ Email configuration incomplete!');
        console.error('   Please set GMAIL_USER and GMAIL_PASSWORD in .env file');
        process.exit(1);
    }

    try {
        // Test basic configuration
        console.log('📝 Testing email configuration...');
        const isConfigValid = await emailService.testEmailConfiguration();
        
        if (!isConfigValid) {
            console.error('❌ Email configuration failed!');
            process.exit(1);
        }

        console.log('✅ Email configuration is valid!\n');

        // Send test enrollment approved email
        console.log('📨 Sending test enrollment APPROVED status email...');
        await emailService.sendEnrollmentStatusUpdate(
            process.env.GMAIL_USER,
            'Test Student',
            'TEST123456',
            'approved'
        );
        console.log('✅ Enrollment approved email sent!\n');

        // Send test enrollment rejected email
        console.log('📨 Sending test enrollment REJECTED status email...');
        await emailService.sendEnrollmentStatusUpdate(
            process.env.GMAIL_USER,
            'Test Student',
            'TEST123457',
            'rejected'
        );
        console.log('✅ Enrollment rejected email sent!\n');

        // Send test document request processing email
        console.log('📨 Sending test document request PROCESSING status email...');
        await emailService.sendDocumentRequestStatusUpdate(
            process.env.GMAIL_USER,
            'Test Student',
            'TESTDOC1234',
            'Certificate of Enrollment',
            'processing'
        );
        console.log('✅ Document request processing email sent!\n');

        // Send test document request ready email
        console.log('📨 Sending test document request READY status email...');
        await emailService.sendDocumentRequestStatusUpdate(
            process.env.GMAIL_USER,
            'Test Student',
            'TESTDOC1235',
            'Certificate of Enrollment',
            'ready'
        );
        console.log('✅ Document request ready email sent!\n');

        // Send test document request rejected email
        console.log('📨 Sending test document request REJECTED status email...');
        await emailService.sendDocumentRequestStatusUpdate(
            process.env.GMAIL_USER,
            'Test Student',
            'TESTDOC1236',
            'Certificate of Enrollment',
            'rejected'
        );
        console.log('✅ Document request rejected email sent!\n');

        console.log('✨ All tests completed successfully!');
        console.log('📧 Check your email inbox for test messages');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    }
}

testEmail();
