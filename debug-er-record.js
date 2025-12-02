#!/usr/bin/env node

const { Pool } = require('pg');

const renderDB = {
    host: 'dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com',
    port: 5432,
    user: 'omias_user',
    password: 'IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj',
    database: 'omias',
    ssl: { rejectUnauthorized: false }
};

async function debugRecord() {
    const pool = new Pool(renderDB);
    
    try {
        console.log('🔍 Fetching the early_registration record...\n');
        
        // Get all columns from the record
        const result = await pool.query(`SELECT * FROM early_registration ORDER BY id DESC LIMIT 1`);
        
        if (result.rows.length === 0) {
            console.log('❌ No records found!');
            return;
        }
        
        const record = result.rows[0];
        console.log('📋 Record data:');
        console.log('=='.repeat(40));
        
        Object.entries(record).forEach(([key, value]) => {
            const displayValue = value === null ? '(NULL)' : JSON.stringify(value);
            console.log(`  ${key.padEnd(25)}: ${displayValue}`);
        });
        
        console.log('=='.repeat(40));
        console.log('\n✅ Total columns in record:', Object.keys(record).length);
        
        // Test the WHERE conditions used in the query
        console.log('\n🔬 Testing WHERE conditions:');
        console.log(`  status = 'pending': ${record.status === 'pending'}`);
        console.log(`  status IS NULL: ${record.status === null}`);
        console.log(`  enrollment_status = 'pending': ${record.enrollment_status === 'pending'}`);
        console.log(`  enrollment_status IS NULL: ${record.enrollment_status === null}`);
        
        // Check if record would be found by our query
        const testQuery = await pool.query(`
            SELECT id, last_name, first_name 
            FROM early_registration 
            WHERE (status = 'pending' OR status IS NULL OR enrollment_status = 'pending' OR enrollment_status IS NULL)
            ORDER BY id DESC
        `);
        
        console.log(`\n✅ Query test result: ${testQuery.rows.length} records found`);
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

debugRecord();
