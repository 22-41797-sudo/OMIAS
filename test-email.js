require('dotenv').config();
const emailService = require('./email-service');

async function testEmail() {
    console.log('📧 Testing Email Configuration...\n');
    
    // Test configuration
    console.log('🔧 Configuration Details:');
    console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`   RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL}\n`);
    
    if (!process.env.RESEND_API_KEY) {
        console.error('❌ Email configuration incomplete!');
        console.error('   Please set RESEND_API_KEY in .env file');
        process.exit(1);
    }

    try {
        // Test basic configuration
        console.log('📝 Testing Resend API configuration...');
        const isConfigValid = await emailService.testEmailConfiguration();
        
        if (!isConfigValid) {
            console.error('❌ Email configuration failed!');
            process.exit(1);
        }

        console.log('✅ Email configuration is valid!\n');

        // Send test enrollment approved email
        console.log('📨 Sending test enrollment APPROVED status email...');
        await emailService.sendEnrollmentStatusUpdate(
            'jamezbello93@gmail.com',
            'Test Student',
            'TEST123456',
            'approved'
        );
        console.log('✅ Enrollment approved email sent!\n');

        // Send test enrollment rejected email
        console.log('📨 Sending test enrollment REJECTED status email...');
        await emailService.sendEnrollmentStatusUpdate(
            'jamezbello93@gmail.com',
            'Test Student',
            'TEST123457',
            'rejected'
        );
        console.log('✅ Enrollment rejected email sent!\n');

        // Send test document request processing email
        console.log('📨 Sending test document request PROCESSING status email...');
        await emailService.sendDocumentRequestStatusUpdate(
            'jamezbello93@gmail.com',
            'Test Student',
            'TESTDOC1234',
            'Certificate of Enrollment',
            'processing'
        );
        console.log('✅ Document request processing email sent!\n');

        // Send test document request ready email
        console.log('📨 Sending test document request READY status email...');
        await emailService.sendDocumentRequestStatusUpdate(
            'jamezbello93@gmail.com',
            'Test Student',
            'TESTDOC1235',
            'Certificate of Enrollment',
            'ready'
        );
        console.log('✅ Document request ready email sent!\n');

        // Send test document request rejected email
        console.log('📨 Sending test document request REJECTED status email...');
        await emailService.sendDocumentRequestStatusUpdate(
            'jamezbello93@gmail.com',
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
