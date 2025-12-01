#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/**
 * Direct restoration script for Render database
 * Uses Render credentials directly
 */

console.log('🚀 Restoring to Render Database\n');

const renderDB = {
    host: 'dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com',
    port: 5432,
    user: 'omias_user',
    password: 'IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj',
    database: 'omias',
    ssl: { rejectUnauthorized: false }
};

async function checkRenderDatabase() {
    const pool = new Pool(renderDB);
    
    try {
        console.log('🔗 Connecting to Render database...');
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Connection successful!');
        console.log(`   Time on server: ${result.rows[0].current_time}\n`);
        
        // Check table counts
        const tables = ['users', 'students', 'early_registration', 'sections', 'teachers'];
        console.log('📊 Table record counts:');
        
        for (const table of tables) {
            try {
                const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                const count = parseInt(countResult.rows[0].count);
                console.log(`   ${table}: ${count} records`);
            } catch (e) {
                console.log(`   ${table}: ⚠️  Not found or error`);
            }
        }
        
        return true;
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        return false;
    } finally {
        await pool.end();
    }
}

checkRenderDatabase().then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
        console.log('✅ Database is ready for data restoration');
        console.log('\n📋 To restore the backup (ICTCOORdb.sql):');
        console.log('   1. Install PostgreSQL CLI tools (pg_restore)');
        console.log('   2. Run:');
        const dbPath = path.resolve('database file/ICTCOORdb.sql');
        console.log(`   set PGPASSWORD=${renderDB.password}`);
        console.log(`   pg_restore -h ${renderDB.host} -U ${renderDB.user} -d ${renderDB.database} -v "${dbPath}"`);
    } else {
        console.log('❌ Database connection failed. Cannot proceed.');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
});
