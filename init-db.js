// Database Initialization Script
// This script ensures the users table exists and creates the default ictcoor account if needed

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Create pool with either DATABASE_URL or individual connection parameters
let pool;
console.log('📍 Environment Check:');
console.log('   DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('   NODE_ENV:', process.env.NODE_ENV);
if (process.env.DATABASE_URL) {
    console.log('   Using DATABASE_URL for connection');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
} else {
    console.log('   Using individual DB parameters (localhost)');
    pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'ICTCOORdb',
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT) || 5432,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
}

async function initializeDatabase() {
    try {
        console.log('🔄 Starting database initialization...');

        // 1. Create users table if it doesn't exist
        console.log('📋 Creating users table if it does not exist...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table is ready');

        // 2. Check if ictcoor account exists
        console.log('🔍 Checking for existing ictcoor account...');
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND role = $2',
            ['ictcoor', 'ictcoor']
        );

        if (existingUser.rows.length > 0) {
            console.log('✅ ICT Coordinator account already exists');
            console.log(`   Username: ${existingUser.rows[0].username}`);
            console.log(`   Role: ${existingUser.rows[0].role}`);
        } else {
            // 3. Create default ictcoor account
            console.log('🆕 Creating default ictcoor account...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const result = await pool.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
                ['ictcoor', hashedPassword, 'ictcoor']
            );

            console.log('✅ ICT Coordinator account created successfully');
            console.log(`   ID: ${result.rows[0].id}`);
            console.log(`   Username: ${result.rows[0].username}`);
            console.log(`   Password: admin123 (hashed in database)`);
            console.log(`   Role: ${result.rows[0].role}`);
        }

        // 4. Create essential tables
        console.log('📋 Creating essential tables...');
        
        // Students table
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
        
        // Add missing columns to students
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS lrn VARCHAR(20)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_id VARCHAR(50)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE');

        // Sections table
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
        
        // Add missing columns to sections
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS adviser_name VARCHAR(255)');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 50');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0');

        // Teachers table
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

        // Early Registration table
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

        // Enrollment Requests table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS enrollment_requests (
                id SERIAL PRIMARY KEY,
                request_token VARCHAR(20) UNIQUE NOT NULL,
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

        // Document Requests table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS document_requests (
                id SERIAL PRIMARY KEY,
                request_token VARCHAR(20) UNIQUE NOT NULL,
                student_name VARCHAR(255) NOT NULL,
                student_id VARCHAR(100),
                contact_number VARCHAR(50),
                email VARCHAR(255) NOT NULL,
                document_type VARCHAR(100),
                quantity INTEGER DEFAULT 1,
                purpose TEXT,
                additional_notes TEXT,
                adviser_name VARCHAR(255),
                adviser_school_year VARCHAR(50),
                student_type VARCHAR(20),
                status VARCHAR(50) DEFAULT 'pending',
                submission_ip VARCHAR(50),
                processed_by INTEGER,
                processed_at TIMESTAMP,
                completion_notes TEXT,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Submission Logs table
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

        // Blocked IPs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS blocked_ips (
                id SERIAL PRIMARY KEY,
                ip_address VARCHAR(45) UNIQUE NOT NULL,
                reason TEXT NOT NULL,
                blocked_by INTEGER,
                blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                unblocked_by INTEGER,
                unblocked_at TIMESTAMP,
                notes TEXT
            )
        `);

        // Messaging table
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

        // Behavior Reports table
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

        // Snapshot groups table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_groups (
                id SERIAL PRIMARY KEY,
                snapshot_name VARCHAR(255) NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_archived BOOLEAN DEFAULT false
            )
        `);

        // Snapshot items table
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

        // Snapshot students table
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

        // ============= TEACHERS ROLE SPECIFIC TABLES =============
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

        // ============= REGISTRAR ROLE SPECIFIC TABLES =============
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

        // ============= GUIDANCE ROLE SPECIFIC TABLES =============
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

        // ============= BEHAVIOR ARCHIVES (GUIDANCE) =============
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

        // ============= COMMUNICATION TABLES =============
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

        // ============= SECURITY & LOGGING TABLES =============
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

        // ============= UPDATE EXISTING TABLES WITH MISSING COLUMNS =============
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS adviser_name VARCHAR(255)');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 50');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS section_code VARCHAR(50) UNIQUE');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20)');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS semester VARCHAR(20)');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS room_number VARCHAR(50)');
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');

        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS lrn VARCHAR(20)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_id VARCHAR(50)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS barangay VARCHAR(100)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS city VARCHAR(100)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS province VARCHAR(100)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_contact VARCHAR(20)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS ext_name VARCHAR(20)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS sex VARCHAR(20)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS age INTEGER');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS birthday DATE');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS religion VARCHAR(50)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS school_year VARCHAR(50)');

        await pool.query('ALTER TABLE teachers ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE');
        await pool.query('ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
        await pool.query('ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');

        await pool.query('ALTER TABLE early_registration ADD COLUMN IF NOT EXISTS sex VARCHAR(20)');
        await pool.query('ALTER TABLE early_registration ADD COLUMN IF NOT EXISTS ext_name VARCHAR(20)');
        await pool.query('ALTER TABLE early_registration ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20)');
        await pool.query('ALTER TABLE early_registration ADD COLUMN IF NOT EXISTS school_year VARCHAR(50)');
        await pool.query('ALTER TABLE early_registration ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

        await pool.query('ALTER TABLE behavior_reports ADD COLUMN IF NOT EXISTS severity VARCHAR(50)');
        await pool.query('ALTER TABLE behavior_reports ADD COLUMN IF NOT EXISTS action_taken TEXT');
        await pool.query('ALTER TABLE behavior_reports ADD COLUMN IF NOT EXISTS follow_up_date DATE');

        await pool.query('ALTER TABLE enrollment_requests ADD COLUMN IF NOT EXISTS request_token VARCHAR(20) UNIQUE');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS request_token VARCHAR(20) UNIQUE');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50)');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS additional_notes TEXT');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS adviser_school_year VARCHAR(50)');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS student_type VARCHAR(20)');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS processed_by INTEGER');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS completion_notes TEXT');
        
        await pool.query('ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');
        await pool.query('ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS blocked_by INTEGER');
        await pool.query('ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS unblocked_by INTEGER');
        await pool.query('ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS unblocked_at TIMESTAMP');
        await pool.query('ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS notes TEXT');

        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP');
        await pool.query('ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP');

        console.log('   ✅ All missing columns added');

        console.log('\n✨ Database initialization completed successfully!');
        console.log('📍 You can now log in at /login');
        console.log('   Username: ictcoor');
        console.log('   Password: admin123\n');

        return true;
    } catch (err) {
        console.error('❌ Database initialization error:', err.message);
        console.error(err);
        return false;
    }
}

module.exports = { initializeDatabase, pool };
