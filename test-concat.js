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

async function testConcat() {
    const pool = new Pool(renderDB);
    
    try {
        console.log('🔬 Testing CONCAT function in PostgreSQL...\n');
        
        const result = await pool.query(`
            SELECT 
                CONCAT(last_name, ', ', first_name, ' ', COALESCE(middle_name, ''), ' ', COALESCE(ext_name, '')) as full_name
            FROM early_registration
            LIMIT 1
        `);
        
        console.log('✅ CONCAT works!');
        console.log('Result:', result.rows[0]);
        
    } catch (err) {
        console.error('❌ CONCAT failed:', err.message);
    } finally {
        await pool.end();
    }
}

testConcat();
