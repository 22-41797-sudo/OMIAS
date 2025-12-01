// Complete Schema Setup for Render Database
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://omias_user:IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj@dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com:5432/omias',
    ssl: { rejectUnauthorized: false }
});

async function setupCompleteSchema() {
    try {
        console.log('🔄 Setting up complete database schema...\n');

        // ============= USERS TABLE =============
        console.log('📋 Creating users table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ users table ready');

        // ============= TEACHERS TABLE =============
        console.log('📋 Creating teachers table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                teacher_id VARCHAR(50) UNIQUE,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                email VARCHAR(100),
                phone VARCHAR(20),
                specialization VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ teachers table ready');

        // ============= SECTIONS TABLE =============
        console.log('📋 Creating sections table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sections (
                id SERIAL PRIMARY KEY,
                section_name VARCHAR(100) UNIQUE,
                grade_level VARCHAR(50),
                adviser_id INTEGER,
                adviser_name VARCHAR(255),
                max_capacity INTEGER DEFAULT 50,
                current_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ sections table ready');

        // ============= STUDENTS TABLE =============
        console.log('📋 Creating students table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE,
                lrn VARCHAR(20),
                enrollment_id VARCHAR(50),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(100),
                grade_level VARCHAR(50),
                section_id INTEGER,
                current_address TEXT,
                enrollment_status VARCHAR(50) DEFAULT 'active',
                has_been_assigned BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ students table ready');

        // Add missing columns to students if needed
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS lrn VARCHAR(20)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_id VARCHAR(50)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE');

        // ============= EARLY REGISTRATION TABLE =============
        console.log('📋 Creating early_registration table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS early_registration (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE,
                lrn VARCHAR(20),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(100),
                age INTEGER,
                grade_level VARCHAR(50),
                guardian_name VARCHAR(255),
                guardian_contact VARCHAR(20),
                current_address TEXT,
                birthday DATE,
                status VARCHAR(50) DEFAULT 'pending',
                submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ early_registration table ready');

        // ============= ENROLLMENT REQUESTS TABLE =============
        console.log('📋 Creating enrollment_requests table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS enrollment_requests (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(50),
                lrn VARCHAR(20),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(100),
                grade_level VARCHAR(50),
                status VARCHAR(50) DEFAULT 'pending',
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ enrollment_requests table ready');

        // ============= DOCUMENT REQUESTS TABLE =============
        console.log('📋 Creating document_requests table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS document_requests (
                id SERIAL PRIMARY KEY,
                request_id VARCHAR(100) UNIQUE,
                student_id VARCHAR(50),
                student_name VARCHAR(255),
                document_type VARCHAR(100),
                quantity INTEGER DEFAULT 1,
                status VARCHAR(50) DEFAULT 'pending',
                email VARCHAR(100),
                phone VARCHAR(20),
                purpose TEXT,
                submission_ip VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ document_requests table ready');

        // ============= SUBMISSION LOGS TABLE =============
        console.log('📋 Creating submission_logs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS submission_logs (
                id SERIAL PRIMARY KEY,
                submission_type VARCHAR(50),
                email VARCHAR(100),
                ip_address VARCHAR(50),
                status VARCHAR(50),
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ submission_logs table ready');

        // ============= BLOCKED IPS TABLE =============
        console.log('📋 Creating blocked_ips table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS blocked_ips (
                id SERIAL PRIMARY KEY,
                ip_address VARCHAR(50) UNIQUE NOT NULL,
                reason TEXT,
                blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP
            )
        `);
        console.log('   ✅ blocked_ips table ready');

        // ============= MESSAGING TABLE =============
        console.log('📋 Creating messaging table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messaging (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER,
                sender_role VARCHAR(50),
                recipient_id INTEGER,
                recipient_role VARCHAR(50),
                message TEXT,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ messaging table ready');

        // ============= BEHAVIOR REPORTS TABLE =============
        console.log('📋 Creating behavior_reports table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS behavior_reports (
                id SERIAL PRIMARY KEY,
                student_id INTEGER,
                student_name VARCHAR(255),
                section_id INTEGER,
                section_name VARCHAR(100),
                incident_type VARCHAR(100),
                description TEXT,
                severity VARCHAR(50),
                reported_by VARCHAR(255),
                report_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ behavior_reports table ready');

        // ============= SNAPSHOT TABLES =============
        console.log('📋 Creating snapshot tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_groups (
                id SERIAL PRIMARY KEY,
                snapshot_name VARCHAR(255) NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_archived BOOLEAN DEFAULT false
            )
        `);
        console.log('   ✅ section_snapshot_groups ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_items (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES section_snapshot_groups(id) ON DELETE CASCADE,
                section_id INTEGER,
                section_name VARCHAR(100),
                grade_level VARCHAR(50),
                count INTEGER,
                adviser_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ section_snapshot_items ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_students (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES section_snapshot_groups(id) ON DELETE CASCADE,
                section_id INTEGER,
                section_name VARCHAR(100),
                student_name VARCHAR(255),
                current_address TEXT,
                barangay VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ section_snapshot_students ready');

        // ============= ADD MISSING COLUMNS =============
        console.log('📋 Adding missing columns to existing tables...');
        
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS adviser_name VARCHAR(255)');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 50');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0');

        console.log('   ✅ All missing columns added');

        console.log('\n✨ Complete database schema setup finished successfully!');
        console.log('\n📊 Tables Created:');
        console.log('   ✅ users');
        console.log('   ✅ teachers');
        console.log('   ✅ sections');
        console.log('   ✅ students');
        console.log('   ✅ early_registration');
        console.log('   ✅ enrollment_requests');
        console.log('   ✅ document_requests');
        console.log('   ✅ submission_logs');
        console.log('   ✅ blocked_ips');
        console.log('   ✅ messaging');
        console.log('   ✅ behavior_reports');
        console.log('   ✅ section_snapshot_groups');
        console.log('   ✅ section_snapshot_items');
        console.log('   ✅ section_snapshot_students');
        console.log('\n🚀 Your Render database is now fully functional!\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error setting up schema:', err.message);
        process.exit(1);
    }
}

setupCompleteSchema();
