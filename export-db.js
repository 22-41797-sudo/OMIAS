/**
 * Database Export Script
 * Exports local PostgreSQL database to a SQL file for backup/migration
 * Usage: node export-db.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const outputFile = `ICTCOORdb_${timestamp}.sql`;
const outputPath = path.join(__dirname, outputFile);

console.log('📦 Starting Database Export...\n');

try {
    // Get database connection details from environment or defaults
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_PORT = process.env.DB_PORT || '5432';
    const DB_NAME = process.env.DB_NAME || 'ICTCOORdb';
    const DB_USER = process.env.DB_USER || 'postgres';
    const DB_PASSWORD = process.env.DB_PASSWORD || 'bello0517';

    // Set password for pg_dump via environment variable
    process.env.PGPASSWORD = DB_PASSWORD;

    console.log('📍 Database Connection Details:');
    console.log(`   Host: ${DB_HOST}`);
    console.log(`   Port: ${DB_PORT}`);
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   User: ${DB_USER}\n`);

    console.log(`💾 Exporting to: ${outputPath}\n`);

    // Execute pg_dump command
    const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -b -v > "${outputPath}"`;
    
    execSync(command, { stdio: 'inherit' });

    // Check if file was created
    if (fs.existsSync(outputPath)) {
        const fileSize = fs.statSync(outputPath).size;
        const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
        
        console.log('\n✅ Database exported successfully!');
        console.log(`📄 File: ${outputFile}`);
        console.log(`📊 Size: ${fileSizeMB} MB`);
        console.log('\n📋 Next steps:');
        console.log('1. Upload this file to your Render database using pgAdmin');
        console.log('2. Or use: psql -h <render-host> -U <render-user> -d <render-db> < ' + outputFile);
    } else {
        console.error('❌ Export failed - no file created');
        process.exit(1);
    }

    // Clean up environment variable
    delete process.env.PGPASSWORD;

} catch (error) {
    console.error('❌ Export error:', error.message);
    console.error('\nMake sure:');
    console.error('  1. PostgreSQL is installed and running');
    console.error('  2. pg_dump is in your PATH');
    console.error('  3. Database credentials are correct in .env file');
    process.exit(1);
}
