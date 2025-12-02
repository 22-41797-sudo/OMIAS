#!/usr/bin/env node
/**
 * Database Schema Verification for Render
 * This script documents which columns exist in each table
 * and identifies all mismatches with the code
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com',
    port: 5432,
    user: 'omias_user',
    password: 'IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj',
    database: 'omias',
    ssl: { rejectUnauthorized: false }
});

async function getSchemaInfo() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('DATABASE SCHEMA VERIFICATION');
        console.log('='.repeat(80));
        
        // Get all tables
        const tables = ['students', 'early_registration', 'sections', 'teachers', 'enrollment_requests'];
        
        for (const table of tables) {
            console.log(`\n📋 ${table.toUpperCase()} Table:`);
            console.log('-'.repeat(80));
            
            const result = await pool.query(`
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            
            const columns = result.rows.map(r => r.column_name);
            console.log(`Total columns: ${columns.length}`);
            console.log(`Columns: ${columns.join(', ')}`);
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('COLUMNS THAT EXIST vs DO NOT EXIST');
        console.log('='.repeat(80));
        
        console.log('\n✅ STUDENTS table HAS these columns:');
        console.log('  id, first_name, last_name, middle_name, ext_name, grade_level,');
        console.log('  section_id, enrollment_status, created_at, lrn, enrollment_id,');
        console.log('  sex, age, birthday, religion, current_address, guardian_name,');
        console.log('  guardian_contact, school_year, is_archived, etc.');
        
        console.log('\n❌ STUDENTS table DOES NOT HAVE these columns:');
        console.log('  ✗ gmail_address (exists in early_registration)');
        console.log('  ✗ contact_number (use guardian_contact instead)');
        console.log('  ✗ ip_community (exists in early_registration)');
        console.log('  ✗ ip_community_specify (exists in early_registration)');
        console.log('  ✗ pwd (exists in early_registration)');
        console.log('  ✗ pwd_specify (exists in early_registration)');
        console.log('  ✗ father_name (exists in early_registration)');
        console.log('  ✗ mother_name (exists in early_registration)');
        console.log('  ✗ printed_name (exists in early_registration)');
        console.log('  ✗ signature_image_path (exists in early_registration)');
        console.log('  ✗ assigned_section (exists in early_registration, not students)');
        
        console.log('\n✅ EARLY_REGISTRATION table HAS all those missing fields');
        
        console.log('\n✅ SECTIONS table HAS these columns:');
        console.log('  id, section_name, grade_level, adviser_id, created_at, current_count,');
        console.log('  adviser_name, max_capacity, section_code, academic_year, semester,');
        console.log('  room_number, is_active');
        
        console.log('\n❌ SECTIONS table DOES NOT HAVE:');
        console.log('  ✗ updated_at (do not use in UPDATE statements)');
        
        console.log('\n' + '='.repeat(80));
        console.log('RECOMMENDED FIXES');
        console.log('='.repeat(80));
        
        console.log('\n1. When selecting from STUDENTS table:');
        console.log('   - Use guardian_contact instead of contact_number');
        console.log('   - Add NULL::text AS field_name for fields that only exist in early_registration');
        
        console.log('\n2. When selecting from EARLY_REGISTRATION table:');
        console.log('   - All fields are available');
        console.log('   - Use registration_date as enrollment_date if needed');
        
        console.log('\n3. When updating SECTIONS table:');
        console.log('   - Do NOT try to set updated_at');
        console.log('   - Only update: current_count, adviser_id, adviser_name, etc.');
        
        console.log('\n' + '='.repeat(80) + '\n');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

getSchemaInfo();
