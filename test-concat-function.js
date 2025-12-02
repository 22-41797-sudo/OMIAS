#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
    host: 'dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com',
    port: 5432,
    user: 'omias_user',
    password: 'IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj',
    database: 'omias',
    ssl: { rejectUnauthorized: false }
});

async function testConcat() {
    try {
        console.log('\n🔍 Testing CONCAT function...\n');
        
        // Test 1: CONCAT function
        try {
            const result = await pool.query(`
                SELECT CONCAT('Hello', ', ', 'World') as result
            `);
            console.log('✅ CONCAT function works!');
            console.log('   Result:', result.rows[0].result);
        } catch (err) {
            console.log('❌ CONCAT function failed:', err.message.split('\n')[0]);
        }
        
        // Test 2: || operator
        try {
            const result = await pool.query(`
                SELECT 'Hello' || ', ' || 'World' as result
            `);
            console.log('\n✅ || operator works!');
            console.log('   Result:', result.rows[0].result);
        } catch (err) {
            console.log('\n❌ || operator failed:', err.message.split('\n')[0]);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testConcat();
