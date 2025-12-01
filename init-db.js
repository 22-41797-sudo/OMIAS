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
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(100),
                grade_level VARCHAR(50),
                section_id INTEGER,
                current_address TEXT,
                enrollment_status VARCHAR(50) DEFAULT 'active',
                has_been_assigned BOOLEAN DEFAULT false,
                lrn VARCHAR(20),
                enrollment_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add missing columns if they don't exist
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS lrn VARCHAR(20)');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_id VARCHAR(50)');

        // Sections table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sections (
                id SERIAL PRIMARY KEY,
                section_name VARCHAR(100) UNIQUE,
                grade_level VARCHAR(50),
                adviser_id INTEGER,
                max_capacity INTEGER,
                current_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add missing columns if they don't exist
        await pool.query('ALTER TABLE sections ADD COLUMN IF NOT EXISTS max_capacity INTEGER');
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
                section_id INTEGER,
                section_name VARCHAR(100),
                student_name VARCHAR(255),
                current_address TEXT,
                barangay VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ All essential tables are ready');

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
