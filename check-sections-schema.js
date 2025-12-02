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

async function checkSectionsSchema() {
    try {
        console.log('\n📋 Sections table schema:\n');
        
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'sections'
            ORDER BY ordinal_position
        `);
        
        result.rows.forEach(col => {
            console.log(`  ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable}`);
        });
        
        console.log(`\n✅ Total columns: ${result.rows.length}\n`);
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

checkSectionsSchema();
