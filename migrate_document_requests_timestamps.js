#!/usr/bin/env node
/**
 * Migration script to add created_at and updated_at columns to document_requests table
 * Run this script to ensure existing data has proper timestamp columns
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

async function migrateTimestamps() {
    try {
        console.log('🔄 Starting migration for document_requests timestamps...');
        
        // Check if created_at column exists
        const checkCreatedAt = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'document_requests' AND column_name = 'created_at'
        `);
        
        if (checkCreatedAt.rows.length === 0) {
            console.log('⚠️ created_at column does not exist. Adding it...');
            await pool.query(`
                ALTER TABLE document_requests 
                ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('✅ created_at column added');
            
            // Update existing records to have created_at if they don't
            await pool.query(`
                UPDATE document_requests 
                SET created_at = CURRENT_TIMESTAMP 
                WHERE created_at IS NULL
            `);
            console.log('✅ Existing records updated with current timestamp');
        } else {
            console.log('✅ created_at column already exists');
            
            // Update any NULL values
            const nullCount = await pool.query(`
                SELECT COUNT(*) as cnt FROM document_requests WHERE created_at IS NULL
            `);
            if (nullCount.rows[0].cnt > 0) {
                console.log(`⚠️ Found ${nullCount.rows[0].cnt} records with NULL created_at`);
                await pool.query(`
                    UPDATE document_requests 
                    SET created_at = CURRENT_TIMESTAMP 
                    WHERE created_at IS NULL
                `);
                console.log('✅ NULL timestamps updated');
            }
        }
        
        // Check if updated_at column exists
        const checkUpdatedAt = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'document_requests' AND column_name = 'updated_at'
        `);
        
        if (checkUpdatedAt.rows.length === 0) {
            console.log('⚠️ updated_at column does not exist. Adding it...');
            await pool.query(`
                ALTER TABLE document_requests 
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('✅ updated_at column added');
        } else {
            console.log('✅ updated_at column already exists');
        }
        
        // Check if rejection_reason column exists
        const checkRejectionReason = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'document_requests' AND column_name = 'rejection_reason'
        `);
        
        if (checkRejectionReason.rows.length === 0) {
            console.log('⚠️ rejection_reason column does not exist. Adding it...');
            await pool.query(`
                ALTER TABLE document_requests 
                ADD COLUMN rejection_reason TEXT
            `);
            console.log('✅ rejection_reason column added');
        } else {
            console.log('✅ rejection_reason column already exists');
        }
        
        // Verify the schema
        const schema = await pool.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'document_requests'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Current document_requests table schema:');
        console.log('─'.repeat(80));
        schema.rows.forEach(col => {
            const defaultVal = col.column_default ? ` [DEFAULT: ${col.column_default}]` : '';
            const nullable = col.is_nullable === 'NO' ? ' NOT NULL' : '';
            console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)}${nullable}${defaultVal}`);
        });
        console.log('─'.repeat(80));
        
        console.log('\n✅ Migration completed successfully!');
        
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrateTimestamps();
