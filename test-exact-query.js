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

async function testQuery() {
    const pool = new Pool(renderDB);
    
    try {
        console.log('🔬 Testing the EXACT enrollees query from /ictcoorLanding...\n');
        
        // This is the EXACT query from the code
        const result = await pool.query(`
            SELECT 
                'ER' || er.id::text as id,
                er.id::text as enrollment_id,
                (er.last_name || ', ' || er.first_name) as full_name,
                er.lrn,
                er.grade_level,
                COALESCE(er.sex, 'N/A') as sex,
                COALESCE(er.age, 0) as age,
                COALESCE(er.contact_number, '') as contact_number,
                NULL as assigned_section,
                er.school_year,
                er.created_at as enrollment_date,
                'pending' as enrollment_status
            FROM early_registration er
            WHERE (status = 'pending' OR status IS NULL)
            ORDER BY er.last_name, er.first_name
        `);
        
        console.log(`✅ Query successful!`);
        console.log(`📊 Records returned: ${result.rows.length}`);
        
        if (result.rows.length > 0) {
            console.log('\n📋 First record:');
            const record = result.rows[0];
            Object.entries(record).forEach(([key, value]) => {
                console.log(`  ${key}: ${JSON.stringify(value)}`);
            });
        }
        
    } catch (err) {
        console.error('❌ Query failed!');
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
    } finally {
        await pool.end();
    }
}

testQuery();
