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

async function checkERSchema() {
    try {
        console.log('\n📋 Early_registration table schema:\n');
        
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'early_registration'
            ORDER BY ordinal_position
        `);
        
        result.rows.forEach(col => {
            console.log(`  ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable}`);
        });
        
        console.log(`\n✅ Total columns: ${result.rows.length}\n`);
        
        // Also check if ID=2 exists
        console.log('🔍 Checking if ER ID 2 exists:\n');
        const erResult = await pool.query('SELECT * FROM early_registration WHERE id = 2');
        if (erResult.rows.length > 0) {
            const record = erResult.rows[0];
            console.log('Found record:');
            Object.entries(record).forEach(([key, value]) => {
                console.log(`  ${key.padEnd(25)}: ${JSON.stringify(value)}`);
            });
        } else {
            console.log('  ❌ No record with ID 2 found');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

checkERSchema();
