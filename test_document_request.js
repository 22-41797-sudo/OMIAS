#!/usr/bin/env node
/**
 * Test script to verify document request system is working correctly
 */

require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = process.env.API_URL || 'http://localhost:3000';

async function testDocumentRequestSystem() {
    console.log('🧪 Testing Document Request System...\n');
    
    try {
        // Step 1: Create a test document request
        console.log('Step 1: Creating a test document request...');
        const submitResponse = await fetch(`${API_BASE}/api/document-request/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentName: 'Test Student',
                studentId: 'TEST-001',
                contactNumber: '09123456789',
                email: 'test@example.com',
                documentType: 'Transcript of Records',
                purpose: 'College Application',
                additionalNotes: 'Test request',
                adviserName: 'Test Adviser',
                adviserSchoolYear: '2025-2026',
                studentType: 'student',
                honeypot: ''
            })
        });
        
        const submitResult = await submitResponse.json();
        
        if (!submitResult.success) {
            console.error('❌ Failed to create request:', submitResult.message);
            process.exit(1);
        }
        
        const token = submitResult.token;
        console.log(`✅ Request created with token: ${token}\n`);
        
        // Step 2: Check the request status
        console.log('Step 2: Checking request status...');
        const statusResponse = await fetch(`${API_BASE}/api/document-request/status/${token}`);
        const statusResult = await statusResponse.json();
        
        if (!statusResult.success) {
            console.error('❌ Failed to check status:', statusResult.message);
            process.exit(1);
        }
        
        const request = statusResult.request;
        console.log('✅ Request data retrieved:');
        console.table({
            'Student Name': request.student_name,
            'Email': request.email,
            'Contact': request.contact_number,
            'Document Type': request.document_type,
            'Purpose': request.purpose,
            'Status': request.status,
            'Created At': request.created_at,
            'Token': request.request_token
        });
        
        // Step 3: Verify all required fields
        console.log('\nStep 3: Verifying all required fields...');
        const requiredFields = ['student_name', 'email', 'contact_number', 'document_type', 'purpose', 'created_at', 'request_token', 'status'];
        let allFieldsValid = true;
        
        requiredFields.forEach(field => {
            const value = request[field];
            const isValid = value !== null && value !== undefined && value !== '';
            const status = isValid ? '✅' : '❌';
            console.log(`${status} ${field}: ${isValid ? value : 'MISSING'}`);
            if (!isValid) allFieldsValid = false;
        });
        
        // Step 4: Check timestamp format
        console.log('\nStep 4: Verifying timestamp...');
        if (request.created_at) {
            const date = new Date(request.created_at);
            const isValidDate = !isNaN(date.getTime());
            console.log(`${isValidDate ? '✅' : '❌'} Timestamp is valid: ${request.created_at}`);
            console.log(`   Parsed as: ${date.toLocaleString('en-US', { timeZone: 'Asia/Manila' })}`);
        } else {
            console.log('❌ Timestamp is missing!');
            allFieldsValid = false;
        }
        
        // Step 5: Summary
        console.log('\n' + '='.repeat(60));
        if (allFieldsValid) {
            console.log('✅ ALL TESTS PASSED - System is working correctly!');
            console.log('\nTo check this request online:');
            console.log(`1. Go to: /check-document-status.html`);
            console.log(`2. Enter token: ${token}`);
            console.log(`3. Click "Check Status"`);
            console.log(`4. Click "Download PDF"`);
        } else {
            console.log('❌ SOME TESTS FAILED - Please check the output above');
        }
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        process.exit(1);
    }
}

testDocumentRequestSystem();
