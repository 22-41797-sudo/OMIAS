/**
 * Database Import Script for Render
 * Imports SQL dump into Render PostgreSQL database
 * Usage: node import-render-db.js <sql-file>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sqlFile = process.argv[2];

if (!sqlFile) {
    console.error('❌ Please provide SQL file path');
    console.error('Usage: node import-render-db.js <path-to-sql-file>');
    process.exit(1);
}

if (!fs.existsSync(sqlFile)) {
    console.error(`❌ File not found: ${sqlFile}`);
    process.exit(1);
}

console.log('📥 Starting Database Import...\n');

try {
    // Get Render database URL from environment
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable not set');
        console.error('   Add it to .env file for Render PostgreSQL');
        process.exit(1);
    }

    console.log('📍 Destination: Render PostgreSQL');
    console.log(`📄 Source file: ${path.basename(sqlFile)}`);
    
    const fileSize = fs.statSync(sqlFile).size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    console.log(`📊 File size: ${fileSizeMB} MB\n`);

    console.log('⚠️  WARNING: This will REPLACE all data in the Render database!');
    console.log('   Make sure you have a backup before proceeding.\n');

    // Set connection string for psql
    process.env.PGPASSWORD = DATABASE_URL.split('@')[0].split('//')[1].split(':')[1];

    console.log('🔄 Importing database...\n');

    // Execute psql command with progress
    const command = `psql "${DATABASE_URL}" -f "${sqlFile}" -v ON_ERROR_STOP=1`;
    
    execSync(command, { stdio: 'inherit' });

    console.log('\n✅ Database imported successfully!');
    console.log('📝 Your Render database has been updated with all tables and data.');
    console.log('\n✨ Application should now work with all existing data!');

} catch (error) {
    console.error('\n❌ Import error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check that DATABASE_URL is correct in .env');
    console.error('  2. Ensure SQL file is valid');
    console.error('  3. Check Render database connectivity');
    process.exit(1);
}
