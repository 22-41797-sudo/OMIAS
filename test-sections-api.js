// Test script to verify sections API is working
const http = require('http');
const https = require('https');

// Test localhost first
const testLocal = () => {
    console.log('\n🧪 Testing local API...');
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/sections/all',
        method: 'GET',
        headers: {
            'Cookie': 'connect.sid=test'
        }
    };
    
    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('✅ API Response:', json);
                console.log(`Found ${json.sections ? json.sections.length : 0} sections`);
            } catch (e) {
                console.log('Response (raw):', data);
            }
        });
    });
    
    req.on('error', (err) => {
        console.error('❌ API Error:', err.message);
    });
    
    req.end();
};

testLocal();
