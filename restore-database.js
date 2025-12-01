#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Script to restore PostgreSQL binary dump to Render database
 * 
 * This uses pg_dump/pg_restore approach via Node.js
 * The dump file should be a PostgreSQL binary format (.sql from pg_dump -Fc)
 */

const dumpFilePath = path.join(__dirname, 'database file', 'ICTCOORdb.sql');

console.log('🔍 PostgreSQL Dump Restoration Tool');
console.log('====================================\n');

// Check if dump file exists
if (!fs.existsSync(dumpFilePath)) {
    console.error('❌ Dump file not found:', dumpFilePath);
    process.exit(1);
}

const stats = fs.statSync(dumpFilePath);
console.log(`📦 Dump file: ${dumpFilePath}`);
console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB\n`);

// Read first bytes to identify format
const header = Buffer.alloc(16);
const fd = fs.openSync(dumpFilePath, 'r');
fs.readSync(fd, header, 0, 16);
fs.closeSync(fd);

const headerString = header.toString('ascii', 0, 4);
console.log(`📋 Dump format: ${headerString}`);

if (headerString === 'PGDM') {
    console.log('✅ This is a PostgreSQL binary dump (custom format)');
    console.log('\n📌 To restore this database:');
    console.log('   Windows:');
    console.log('     1. Install PostgreSQL (includes pg_restore)');
    console.log('     2. Set environment variable: set PGPASSWORD=IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj');
    console.log('     3. Run: pg_restore -h dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com -U omias_user -d omias -v ' + dumpFilePath);
    console.log('\n   Linux/Mac:');
    console.log('     export PGPASSWORD=IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj');
    console.log('     pg_restore -h dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com -U omias_user -d omias -v ' + dumpFilePath);
    console.log('\n   Or use local psql if PostgreSQL is running locally:');
    console.log('     psql -U postgres -d ICTCOORdb < this_script.sql');
} else {
    console.log('⚠️  This might be a text SQL file. First 4 bytes:', headerString);
}

console.log('\n📝 Alternative: Create a text dump from this binary dump:');
console.log('   If you have PostgreSQL installed, convert with:');
console.log('   pg_dump -Fp -f ICTCOORdb-text.sql (on the machine with pg_dump)');

// Try to connect to Render database and show status
console.log('\n🔗 Checking Render database connection...');

async function checkConnection() {
    const isRenderDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.render.com');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isRenderDB ? { rejectUnauthorized: false } : false
    });

    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM early_registration');
        console.log(`   ✅ Connected! early_registration has ${result.rows[0].count} records`);
    } catch (err) {
        console.log(`   ⚠️  early_registration error: ${err.message}`);
        // Try to check users table instead
        try {
            const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
            console.log(`   ✅ Connected! users table has ${userResult.rows[0].count} records`);
        } catch (e) {
            console.log(`   ❌ Database connection failed: ${e.message}`);
        }
    } finally {
        await pool.end();
    }
}

checkConnection().catch(console.error);
