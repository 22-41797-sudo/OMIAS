#!/usr/bin/env node
/**
 * Fix NULL timestamps in document_requests table
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function fixNullTimestamps() {
    try {
        console.log('🔍 Checking for NULL timestamps...');
        
        const checkResult = await pool.query(`
            SELECT COUNT(*) as null_count FROM document_requests WHERE created_at IS NULL
        `);
        
        const nullCount = checkResult.rows[0].null_count;
        console.log(`Found ${nullCount} records with NULL created_at`);
        
        if (nullCount > 0) {
            console.log('🔄 Fixing NULL timestamps...');
            await pool.query(`
                UPDATE document_requests 
                SET created_at = CURRENT_TIMESTAMP 
                WHERE created_at IS NULL
            `);
            console.log(`✅ Fixed ${nullCount} records`);
        } else {
            console.log('✅ No NULL timestamps found');
        }
        
        // Show recent records
        console.log('\n📋 Recent 5 document requests:');
        const recent = await pool.query(`
            SELECT id, request_token, student_name, created_at, status 
            FROM document_requests 
            ORDER BY id DESC LIMIT 5
        `);
        console.table(recent.rows);
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixNullTimestamps();
