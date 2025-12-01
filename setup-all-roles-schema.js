// Complete Schema Setup for All Roles (Teacher, Registrar, Guidance, Public)
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://omias_user:IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj@dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com:5432/omias',
    ssl: { rejectUnauthorized: false }
});

async function setupCompleteSchemaWithAllRoles() {
    try {
        console.log('🔄 Setting up complete database schema for ALL ROLES...\n');

        // ============= CORE AUTHENTICATION =============
        console.log('📋 Creating authentication tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ users table');

        // ============= TEACHERS TABLE (For Teacher Login) =============
        console.log('📋 Creating teacher tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                teacher_id VARCHAR(50) UNIQUE,
                user_id INTEGER REFERENCES users(id),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(20),
                specialization VARCHAR(100),
                department VARCHAR(100),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ teachers table');

        // Teacher Sections Assignment
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teacher_sections (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER REFERENCES teachers(id),
                section_id INTEGER,
                academic_year VARCHAR(20),
                is_current BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ teacher_sections table');

        // ============= REGISTRAR TABLES =============
        console.log('📋 Creating registrar tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS registrar_accounts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                registrar_id VARCHAR(50) UNIQUE,
                office_name VARCHAR(100),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ registrar_accounts table');

        // ============= GUIDANCE TABLES =============
        console.log('📋 Creating guidance counselor tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guidance_accounts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                guidance_id VARCHAR(50) UNIQUE,
                counselor_name VARCHAR(255),
                email VARCHAR(100),
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ guidance_accounts table');

        // ============= STUDENTS & ENROLLMENT =============
        console.log('📋 Creating student and enrollment tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE,
                lrn VARCHAR(20),
                enrollment_id VARCHAR(50),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(100),
                date_of_birth DATE,
                gender VARCHAR(20),
                grade_level VARCHAR(50),
                section_id INTEGER,
                current_address TEXT,
                barangay VARCHAR(100),
                city VARCHAR(100),
                province VARCHAR(100),
                guardian_name VARCHAR(255),
                guardian_contact VARCHAR(20),
                enrollment_status VARCHAR(50) DEFAULT 'active',
                has_been_assigned BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ students table');

        // Early Registration
        await pool.query(`
            CREATE TABLE IF NOT EXISTS early_registration (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE,
                lrn VARCHAR(20),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(100),
                date_of_birth DATE,
                age INTEGER,
                gender VARCHAR(20),
                grade_level VARCHAR(50),
                guardian_name VARCHAR(255),
                guardian_contact VARCHAR(20),
                current_address TEXT,
                barangay VARCHAR(100),
                city VARCHAR(100),
                province VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ early_registration table');

        // Enrollment Requests (Registrar)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS enrollment_requests (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(50),
                lrn VARCHAR(20),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(100),
                date_of_birth DATE,
                grade_level VARCHAR(50),
                guardian_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                rejection_reason TEXT,
                processed_by INTEGER REFERENCES registrar_accounts(id),
                submitted_at TIMESTAMP,
                processed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ enrollment_requests table');

        // ============= SECTIONS =============
        console.log('📋 Creating sections table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sections (
                id SERIAL PRIMARY KEY,
                section_name VARCHAR(100) UNIQUE,
                section_code VARCHAR(50) UNIQUE,
                grade_level VARCHAR(50),
                adviser_id INTEGER REFERENCES teachers(id),
                adviser_name VARCHAR(255),
                max_capacity INTEGER DEFAULT 50,
                current_count INTEGER DEFAULT 0,
                academic_year VARCHAR(20),
                semester VARCHAR(20),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ sections table');

        // ============= BEHAVIOR & DISCIPLINE (Guidance & Teachers) =============
        console.log('📋 Creating behavior and discipline tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS behavior_reports (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id),
                student_name VARCHAR(255),
                section_id INTEGER REFERENCES sections(id),
                section_name VARCHAR(100),
                incident_type VARCHAR(100),
                description TEXT,
                severity VARCHAR(50),
                reported_by VARCHAR(255),
                reported_by_id INTEGER REFERENCES teachers(id),
                report_date DATE,
                action_taken TEXT,
                follow_up_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ behavior_reports table');

        // Behavior Archives
        await pool.query(`
            CREATE TABLE IF NOT EXISTS behavior_report_archives (
                id SERIAL PRIMARY KEY,
                original_report_id INTEGER REFERENCES behavior_reports(id),
                student_id INTEGER REFERENCES students(id),
                section_id INTEGER REFERENCES sections(id),
                report_data JSON,
                archived_by INTEGER REFERENCES guidance_accounts(id),
                school_year VARCHAR(20),
                archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ behavior_report_archives table');

        // ============= DOCUMENT REQUESTS (Public Enrollment) =============
        console.log('📋 Creating document request tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS document_requests (
                id SERIAL PRIMARY KEY,
                request_id VARCHAR(100) UNIQUE,
                student_id VARCHAR(50),
                student_name VARCHAR(255),
                email VARCHAR(100),
                phone VARCHAR(20),
                document_type VARCHAR(100),
                quantity INTEGER DEFAULT 1,
                purpose TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                submission_ip VARCHAR(50),
                processed_by INTEGER REFERENCES registrar_accounts(id),
                processed_at TIMESTAMP,
                submitted_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ document_requests table');

        // ============= MESSAGING & NOTIFICATIONS =============
        console.log('📋 Creating messaging tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messaging (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER,
                sender_role VARCHAR(50),
                recipient_id INTEGER,
                recipient_role VARCHAR(50),
                message TEXT,
                attachment_url TEXT,
                is_read BOOLEAN DEFAULT false,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ messaging table');

        // Notifications
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                user_role VARCHAR(50),
                notification_type VARCHAR(100),
                title VARCHAR(255),
                message TEXT,
                is_read BOOLEAN DEFAULT false,
                link VARCHAR(255),
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ notifications table');

        // ============= SUBMISSION & SECURITY LOGS =============
        console.log('📋 Creating security and logging tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS submission_logs (
                id SERIAL PRIMARY KEY,
                submission_type VARCHAR(50),
                email VARCHAR(100),
                ip_address VARCHAR(50),
                user_agent TEXT,
                status VARCHAR(50),
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ submission_logs table');

        // Blocked IPs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS blocked_ips (
                id SERIAL PRIMARY KEY,
                ip_address VARCHAR(50) UNIQUE NOT NULL,
                reason TEXT,
                attempted_action VARCHAR(100),
                attempt_count INTEGER DEFAULT 1,
                blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP
            )
        `);
        console.log('   ✅ blocked_ips table');

        // Login Logs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS login_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                username VARCHAR(255),
                role VARCHAR(50),
                ip_address VARCHAR(50),
                user_agent TEXT,
                login_status VARCHAR(50),
                failed_attempts INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ login_logs table');

        // ============= SNAPSHOTS (ICT COORDINATOR) =============
        console.log('📋 Creating snapshot tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_groups (
                id SERIAL PRIMARY KEY,
                snapshot_name VARCHAR(255) NOT NULL,
                created_by INTEGER REFERENCES users(id),
                school_year VARCHAR(20),
                semester VARCHAR(20),
                total_students INTEGER DEFAULT 0,
                total_sections INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_archived BOOLEAN DEFAULT false
            )
        `);
        console.log('   ✅ section_snapshot_groups table');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_items (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES section_snapshot_groups(id) ON DELETE CASCADE,
                section_id INTEGER REFERENCES sections(id),
                section_name VARCHAR(100),
                section_code VARCHAR(50),
                grade_level VARCHAR(50),
                count INTEGER,
                adviser_id INTEGER REFERENCES teachers(id),
                adviser_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ section_snapshot_items table');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_students (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES section_snapshot_groups(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES students(id),
                section_id INTEGER REFERENCES sections(id),
                section_name VARCHAR(100),
                student_name VARCHAR(255),
                lrn VARCHAR(20),
                current_address TEXT,
                barangay VARCHAR(100),
                grade_level VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ section_snapshot_students table');

        // ============= AUDIT TRAIL =============
        console.log('📋 Creating audit trail table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                username VARCHAR(255),
                user_role VARCHAR(50),
                action VARCHAR(100),
                table_name VARCHAR(100),
                record_id INTEGER,
                changes JSON,
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ audit_logs table');

        console.log('\n✨ Complete database schema setup finished successfully!');
        console.log('\n📊 All Tables Created:');
        console.log('\n   Authentication:');
        console.log('   ✅ users');
        console.log('\n   Teachers:');
        console.log('   ✅ teachers');
        console.log('   ✅ teacher_sections');
        console.log('\n   Registrar:');
        console.log('   ✅ registrar_accounts');
        console.log('\n   Guidance Counselors:');
        console.log('   ✅ guidance_accounts');
        console.log('\n   Students & Enrollment:');
        console.log('   ✅ students');
        console.log('   ✅ early_registration');
        console.log('   ✅ enrollment_requests');
        console.log('\n   Academic:');
        console.log('   ✅ sections');
        console.log('   ✅ teacher_sections');
        console.log('\n   Behavior & Discipline:');
        console.log('   ✅ behavior_reports');
        console.log('   ✅ behavior_report_archives');
        console.log('\n   Documents & Requests:');
        console.log('   ✅ document_requests');
        console.log('\n   Communication:');
        console.log('   ✅ messaging');
        console.log('   ✅ notifications');
        console.log('\n   Security & Logging:');
        console.log('   ✅ submission_logs');
        console.log('   ✅ blocked_ips');
        console.log('   ✅ login_logs');
        console.log('   ✅ audit_logs');
        console.log('\n   Snapshots:');
        console.log('   ✅ section_snapshot_groups');
        console.log('   ✅ section_snapshot_items');
        console.log('   ✅ section_snapshot_students');
        console.log('\n🚀 Your Render database is now FULLY functional for all roles!\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error setting up schema:', err.message);
        process.exit(1);
    }
}

setupCompleteSchemaWithAllRoles();
